# Phase 2: Receipt Processing - Research

**Researched:** 2026-01-14
**Domain:** Receipt capture, OCR extraction, and error correction for mobile web
**Confidence:** HIGH

<research_summary>
## Summary

Researched the complete receipt processing pipeline: camera capture on mobile browsers, file upload handling, OCR extraction using LLM vision, and user correction UI patterns.

**Key findings:**

1. **Camera capture:** Use native `<input type="file" accept="image/*" capture="environment">` for simplest mobile UX. `react-webcam` works but adds complexity for a simple photo capture use case. The native file input triggers the device camera directly.

2. **OCR strategy:** Claude Vision API is the clear winner for this use case (97% accuracy vs 50-85% Tesseract.js). Single API call returns structured JSON with line items, prices, tax, totals. Cost is ~$0.004/receipt at 1000x1000px resolution.

3. **File storage:** Convex has built-in file storage. 3-step process: generate upload URL → POST file → save storage ID. Maximum 5MB per image via API (sufficient for receipts).

4. **Error correction:** Always show extracted items for user review. Common errors: price/item misalignment when notes exist between lines, faded thermal paper, handwritten additions. LLMs handle these better than traditional OCR but still need human verification.

**Primary recommendations:**
- Native file input with `capture="environment"` for camera
- Convex file storage for receipt images
- Claude Sonnet for OCR (claude-sonnet-4-5)
- Editable item list UI for corrections
</research_summary>

<standard_stack>
## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex file storage | Built-in | Image storage | Already using Convex, no extra deps |
| @anthropic-ai/sdk | ^0.50+ | Claude API client | Official SDK for vision API |
| Native file input | N/A | Camera capture | Simplest, most reliable on mobile |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-webcam | 7.2.0 | Custom camera UI | Only if custom viewfinder needed |
| browser-image-compression | 2.0.2 | Client-side resize | If images too large |
| exifr | 7.1.3 | EXIF extraction | If need photo orientation fixes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Claude Vision | Google Cloud Vision | GCV: $1.50/1000 images, no structured output |
| Claude Vision | AWS Textract | Textract: Table extraction, more setup |
| Claude Vision | Tesseract.js | Free but 50-85% accuracy on photos |
| Native file input | react-webcam | More control but more code |

**Installation:**
```bash
npm install @anthropic-ai/sdk
# Optional for custom camera UI:
npm install react-webcam browser-image-compression
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── ReceiptCapture/     # Camera/upload UI
│   │   ├── CameraButton.tsx
│   │   └── UploadButton.tsx
│   ├── ReceiptReview/      # OCR results + editing
│   │   ├── ItemList.tsx
│   │   ├── EditableItem.tsx
│   │   └── TotalsEditor.tsx
│   └── ReceiptImage/       # Display stored receipt
convex/
├── actions/
│   └── parseReceipt.ts     # Claude Vision OCR
├── receipts.ts             # File upload mutations
└── items.ts                # Item CRUD after extraction
```

### Pattern 1: Native Camera Capture (Recommended)
**What:** Use HTML file input with capture attribute for mobile camera
**When to use:** Simple "take a photo" use case like this app
**Example:**
```typescript
// components/ReceiptCapture/CameraButton.tsx
import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function CameraButton({ sessionId, onCapture }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.receipts.generateUploadUrl);
  const saveReceipt = useMutation(api.receipts.saveReceipt);
  const [isUploading, setIsUploading] = useState(false);

  async function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // Step 3: Save to database
      await saveReceipt({ sessionId, storageId });
      onCapture(storageId);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"  // Opens rear camera on mobile
        onChange={handleCapture}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isUploading ? "Uploading..." : "Take Photo"}
      </button>
    </>
  );
}
```

### Pattern 2: Convex File Storage Flow
**What:** 3-step upload: generate URL → POST → save ID
**When to use:** Any file upload in Convex
**Example:**
```typescript
// convex/receipts.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Step 1: Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Step 3: Save storage ID to database
export const saveReceipt = mutation({
  args: {
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      receiptImageId: args.storageId,
    });
    return args.storageId;
  },
});

// Get receipt image URL for display
export const getReceiptUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

### Pattern 3: Claude Vision OCR Action
**What:** Convex action that calls Claude API for receipt parsing
**When to use:** Server-side OCR processing
**Example:**
```typescript
// convex/actions/parseReceipt.ts
import { action } from "../_generated/server";
import { v } from "convex/values";
import Anthropic from "@anthropic-ai/sdk";

const RECEIPT_PROMPT = `Extract all line items from this receipt image.
Return ONLY valid JSON in this exact format:
{
  "merchant": "store name",
  "items": [
    { "name": "item description", "price": 12.99, "quantity": 1 }
  ],
  "subtotal": 45.97,
  "tax": 3.68,
  "total": 49.65
}
Notes:
- Prices should be numbers (not strings)
- Include all items, even if quantity is 1
- If a field is unclear, use null
- Do not include any explanation, only the JSON`;

export const parseReceiptFromStorage = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    // Get the image as a blob
    const imageBlob = await ctx.storage.get(args.storageId);
    if (!imageBlob) throw new Error("Image not found");

    // Convert to base64
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Determine media type
    const mediaType = imageBlob.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: "text",
            text: RECEIPT_PROMPT,
          },
        ],
      }],
    });

    // Parse the JSON response
    const text = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    try {
      return JSON.parse(text);
    } catch {
      // If JSON parsing fails, return the raw text for debugging
      return { error: "Failed to parse response", raw: text };
    }
  },
});
```

### Pattern 4: Editable Item List
**What:** UI that shows extracted items with inline editing
**When to use:** Review/correction step after OCR
**Example:**
```typescript
// components/ReceiptReview/ItemList.tsx
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ExtractedItem {
  name: string;
  price: number;
  quantity: number;
}

export function ItemList({
  items,
  sessionId,
  onConfirm
}: {
  items: ExtractedItem[];
  sessionId: string;
  onConfirm: () => void;
}) {
  const [editedItems, setEditedItems] = useState(items);
  const addItems = useMutation(api.items.addBulk);

  function handleEdit(index: number, field: keyof ExtractedItem, value: string | number) {
    setEditedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }

  function handleDelete(index: number) {
    setEditedItems(prev => prev.filter((_, i) => i !== index));
  }

  function handleAdd() {
    setEditedItems(prev => [...prev, { name: "", price: 0, quantity: 1 }]);
  }

  async function handleConfirm() {
    // Convert prices to cents for storage
    const itemsInCents = editedItems.map(item => ({
      ...item,
      price: Math.round(item.price * 100),
    }));

    await addItems({ sessionId, items: itemsInCents });
    onConfirm();
  }

  return (
    <div className="space-y-2">
      {editedItems.map((item, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            value={item.name}
            onChange={e => handleEdit(index, "name", e.target.value)}
            className="flex-1 border rounded px-2 py-1"
            placeholder="Item name"
          />
          <input
            type="number"
            value={item.price}
            onChange={e => handleEdit(index, "price", parseFloat(e.target.value) || 0)}
            className="w-20 border rounded px-2 py-1"
            step="0.01"
          />
          <button onClick={() => handleDelete(index)} className="text-red-500">
            ×
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <button onClick={handleAdd} className="text-blue-500">
          + Add Item
        </button>
        <button onClick={handleConfirm} className="bg-green-500 text-white px-4 py-1 rounded">
          Confirm Items
        </button>
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Client-side OCR:** Tesseract.js is too slow and inaccurate for mobile photos
- **No user review:** Always let users edit extracted items before saving
- **Blocking on OCR:** Show loading state but don't block entire UI
- **Storing base64 in database:** Use Convex file storage, not text fields
- **Skipping image compression:** Large photos slow upload and increase API costs
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Receipt parsing | Regex + string matching | Claude Vision | Receipt formats vary wildly; LLM handles naturally |
| Line item extraction | Custom parser | Claude structured output | Notes between items, discounts confuse parsers |
| Price extraction | Number regex | LLM context | "2 @ $3.99", "Buy 1 Get 1", etc. |
| Camera UI | getUserMedia manually | Native file input | Browser handles permissions, camera selection |
| Image upload | Custom FormData handling | Convex file storage | Handles signed URLs, storage, retrieval |
| Image resizing | Canvas manipulation | browser-image-compression | Handles orientation, quality, async |

**Key insight:** LLM vision has transformed receipt OCR. What used to require complex pipelines (preprocessing → OCR → entity extraction → parsing → validation) is now a single API call. The LLM understands context ("this note belongs to the item above") that rule-based systems cannot.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Price/Item Misalignment
**What goes wrong:** OCR assigns price to wrong item when notes exist between lines
**Why it happens:** Traditional OCR reads top-to-bottom without semantic understanding
**How to avoid:** Use LLM vision which understands "no price = modifier of previous item"
**Warning signs:** Items with $0.00 price, prices that seem too high

### Pitfall 2: Thermal Paper Fade
**What goes wrong:** Old receipts are illegible, OCR fails completely
**Why it happens:** Thermal paper fades over time, especially in heat
**How to avoid:** Detect low confidence from LLM response, prompt user to re-take or enter manually
**Warning signs:** Many null fields in response, "unclear" in LLM output

### Pitfall 3: Mobile Camera Orientation
**What goes wrong:** Image appears rotated or upside-down
**Why it happens:** EXIF orientation not respected by all browsers/tools
**How to avoid:** Use browser-image-compression which handles orientation, or let Claude handle it (it can read rotated text)
**Warning signs:** Portrait photo appears landscape, text sideways

### Pitfall 4: Large Image Upload Timeout
**What goes wrong:** Upload fails on slow connections
**Why it happens:** Modern phone cameras produce 5-15MB images
**How to avoid:** Compress to ~1000px before upload (still plenty for OCR)
**Warning signs:** Upload spinner never completes, timeout errors

### Pitfall 5: API Rate Limits
**What goes wrong:** Claude API returns 429 errors during group photo-taking
**Why it happens:** Multiple users uploading receipts simultaneously
**How to avoid:** Add retry with exponential backoff, queue processing
**Warning signs:** Intermittent OCR failures, "rate limited" errors

### Pitfall 6: Blocking UI During OCR
**What goes wrong:** User thinks app is frozen
**Why it happens:** OCR takes 2-5 seconds, no feedback shown
**How to avoid:** Show clear "Analyzing receipt..." state with progress indicator
**Warning signs:** Users refreshing page, multiple uploads of same receipt
</common_pitfalls>

<code_examples>
## Code Examples

### Native File Input with Compression
```typescript
// Source: browser-image-compression + native input pattern
import imageCompression from "browser-image-compression";

async function handleFileSelect(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,           // Max 1MB
    maxWidthOrHeight: 1500, // Max dimension 1500px
    useWebWorker: true,     // Non-blocking
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed: ${file.size} → ${compressedFile.size}`);
    return compressedFile;
  } catch (error) {
    console.error("Compression failed, using original:", error);
    return file; // Fall back to original
  }
}
```

### Claude Vision API Call
```typescript
// Source: Anthropic Claude Vision docs
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5-20250514",
  max_tokens: 2048,
  messages: [{
    role: "user",
    content: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64ImageData,
        },
      },
      {
        type: "text",
        text: "Extract line items as JSON...",
      },
    ],
  }],
});
```

### Convex Action with Storage Access
```typescript
// Source: Convex file storage docs
import { action } from "./_generated/server";
import { v } from "convex/values";

export const processStoredImage = action({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    // Get blob from Convex storage
    const blob = await ctx.storage.get(args.storageId);
    if (!blob) throw new Error("Image not found");

    // Convert to base64 for API
    const buffer = await blob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Call external API (Claude)
    // ...

    return result;
  },
});
```

### Error Handling for OCR
```typescript
// Robust OCR with fallback
async function extractReceiptData(storageId: string) {
  try {
    const result = await parseReceipt({ storageId });

    if (result.error) {
      // OCR ran but couldn't parse
      return { success: false, needsManualEntry: true, raw: result.raw };
    }

    if (!result.items || result.items.length === 0) {
      // OCR returned empty
      return { success: false, needsManualEntry: true, message: "No items found" };
    }

    return { success: true, data: result };
  } catch (error) {
    // API error
    console.error("OCR failed:", error);
    return { success: false, needsManualEntry: true, error: String(error) };
  }
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tesseract + custom parsing | LLM Vision | 2024 | Single API call, 97% accuracy |
| Template-based extraction | Template-free LLM | 2024 | Works on any receipt format |
| Client-side OCR | Server-side LLM | 2024 | Better accuracy, faster |
| Multi-stage pipelines | End-to-end LLM | 2024 | Simpler architecture |

**New tools/patterns to consider:**
- **Claude Sonnet 4.5:** Latest model with improved vision (Q1 2025)
- **Structured Output:** Claude can now return guaranteed valid JSON
- **Files API:** Upload once, reference multiple times (reduces tokens)

**Deprecated/outdated:**
- **Tesseract.js for receipts:** Too inaccurate for phone photos
- **Google Document AI:** Requires GCP setup, LLMs are simpler
- **Custom preprocessing:** Modern LLMs handle poor quality images
</sota_updates>

<cost_analysis>
## Cost Analysis

### Claude Vision API Pricing

| Image Size | Tokens | Cost/Image | Cost/1000 Images |
|------------|--------|------------|------------------|
| 200x200 px | ~54 | $0.00016 | $0.16 |
| 1000x1000 px | ~1334 | $0.004 | $4.00 |
| 1092x1092 px | ~1590 | $0.0048 | $4.80 |

Formula: `tokens = (width × height) / 750`

**For this app (receipt photos):**
- Recommended size: ~1000x1000 px (compress before upload)
- Cost per receipt: ~$0.004-0.005 (input) + ~$0.003 (output ~200 tokens)
- Total per receipt: **~$0.007-0.008**

**Monthly cost estimates:**

| Usage | Receipts/month | Cost/month |
|-------|----------------|------------|
| Light | 100 | ~$0.80 |
| Medium | 500 | ~$4.00 |
| Heavy | 2000 | ~$16.00 |
| Scale | 10000 | ~$80.00 |

**Comparison with alternatives:**

| Service | Cost/1000 receipts | Notes |
|---------|-------------------|-------|
| Claude Vision | ~$8 | Recommended |
| Google Cloud Vision | $1.50 | No structured output |
| Mindee Receipt API | $100 | Specialized but pricier |
| Veryfi | $80 | Enterprise features |
| Tesseract.js | Free | 50-85% accuracy |

**Verdict:** Claude Vision is cost-effective at this scale with superior accuracy.
</cost_analysis>

<open_questions>
## Open Questions

1. **OCR retry strategy**
   - What we know: Claude API can fail (rate limits, timeouts)
   - What's unclear: How many retries? Exponential backoff timing?
   - Recommendation: 3 retries with 1s, 2s, 4s delays

2. **Multiple receipt photos**
   - What we know: Some receipts are long and need multiple photos
   - What's unclear: How to handle multi-page receipts?
   - Recommendation: Start with single-photo, add "add another photo" later if needed

3. **Receipt image storage duration**
   - What we know: Convex stores files indefinitely
   - What's unclear: Should receipts be deleted after session ends?
   - Recommendation: Keep for 30 days (dispute resolution), then clean up

4. **Manual entry fallback**
   - What we know: OCR will fail sometimes
   - What's unclear: Should manual entry be prominent or hidden?
   - Recommendation: Show "Enter manually" button alongside camera, don't hide it
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Claude Vision Docs](https://platform.claude.com/docs/en/build-with-claude/vision) - Official API documentation, token calculation, examples
- [Convex File Storage](https://docs.convex.dev/file-storage/upload-files) - Official upload flow, storage API
- [Anthropic Pricing](https://platform.claude.com/docs/en/about-claude/pricing) - Current token pricing

### Secondary (MEDIUM confidence)
- [Receipt OCR Benchmark 2026](https://research.aimultiple.com/receipt-ocr/) - Claude 97% accuracy benchmark
- [OCR Benchmark 2026](https://research.aimultiple.com/ocr-accuracy/) - Cloud OCR comparison
- [Best OCR APIs 2026](https://www.klippa.com/en/blog/information/best-ocr-api/) - Industry comparison
- [react-webcam npm](https://www.npmjs.com/package/react-webcam) - Camera library docs
- [browser-image-compression npm](https://www.npmjs.com/package/browser-image-compression) - Compression library

### Tertiary (needs validation)
- Pricing may change; verify at official docs before implementation
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Claude Vision API, Convex file storage
- Ecosystem: Camera capture, image compression, OCR
- Patterns: File upload flow, OCR action, editable item list
- Pitfalls: Orientation, timeouts, rate limits, thermal fade

**Confidence breakdown:**
- Standard stack: HIGH - verified with official docs
- Architecture: HIGH - from Convex and Claude official examples
- Pitfalls: HIGH - documented issues from OCR research
- Code examples: HIGH - adapted from official documentation
- Cost analysis: HIGH - from official pricing pages

**Research date:** 2026-01-14
**Valid until:** 2026-02-14 (30 days - APIs relatively stable)
</metadata>

---

*Phase: 02-receipt-processing*
*Research completed: 2026-01-14*
*Ready for planning: yes*

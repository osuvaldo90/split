# Phase 22: Handwritten Tip Detection - Research

**Researched:** 2026-01-19
**Domain:** Claude Vision handwriting recognition, tip detection prompt engineering
**Confidence:** HIGH

## Summary

Handwritten tip detection is an extension of the existing receipt OCR flow. Claude Vision (Claude Sonnet 4.5) has strong handwriting recognition capabilities, ranked #3 among Vision LLMs for OCR with particular strength in cursive and handwritten text interpretation. The existing `parseReceipt.ts` architecture already uses structured outputs and can be extended with minimal changes to detect handwritten tip amounts.

The key insight is that Claude Vision can naturally distinguish handwritten from printed text as part of its image understanding. The prompt should explicitly instruct Claude to look for handwritten amounts on tip/gratuity lines and ignore pre-printed tip suggestions. The existing discriminated union response schema can be extended to include an optional `handwritten_tip` field with confidence scoring.

**Primary recommendation:** Extend the existing `parseReceipt` prompt and schema to include handwritten tip detection. Add a `handwritten_tip` object with `amount` and `confidence` fields. Only pre-fill when confidence exceeds threshold (recommended: 0.8 for handwriting which is harder than printed text). The frontend already has `updateTip` mutation infrastructure to pre-fill tip values.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.71.2 | Claude Vision API | Already in use, supports structured outputs beta |
| Claude Sonnet 4.5 | 20250929 | Vision model | Already configured, excellent at handwriting recognition |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Convex | existing | Backend mutations | updateTip mutation already exists |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Claude-based detection | Dedicated handwriting OCR (Mindee, Veryfi) | Extra dependency, cost, latency; Claude already does this well |
| Single-pass detection | Two-pass (detect signature first, then tip) | Unnecessary complexity; Claude can handle in one pass |
| Confidence threshold | Always pre-fill | Too many false positives would frustrate users |

**Installation:**
```bash
# No new packages needed - existing SDK supports all required features
```

## Architecture Patterns

### Recommended Response Structure

Extend the existing `receiptValidationSchema` to include handwritten tip detection:

```typescript
// Add to existing data schema when is_receipt is true
{
  is_receipt: true,
  confidence: 0.95,
  data: {
    merchant: "...",
    items: [...],
    subtotal: ...,
    fees: [...],
    total: ...,
    // NEW: Handwritten tip detection
    handwritten_tip: {
      detected: true,
      amount: 8.50,        // Dollar amount (null if not numeric)
      confidence: 0.85,    // Confidence in detection (0.0 to 1.0)
      raw_text: "$8.50"    // Original text seen (for debugging)
    } | null               // null when no handwritten tip detected
  }
}
```

### Pattern 1: Single-Pass Combined Detection (Recommended)

**What:** Extend existing receipt extraction prompt to also detect handwritten tips
**When to use:** Always - this is the recommended pattern
**Why:** No additional API calls, leverages existing infrastructure

```typescript
// Add to existing RECEIPT_VALIDATION_PROMPT
const HANDWRITTEN_TIP_INSTRUCTIONS = `
- handwritten_tip: Look for a HANDWRITTEN tip amount on the receipt
  - Only detect amounts that appear to be written by hand (pen/pencil marks)
  - Ignore pre-printed tip suggestions or calculations, even if circled
  - If a tip line shows a dollar amount (e.g., "$8", "8.00", "$8.50"), extract it
  - If tip shows "CASH" or "ON TABLE", set detected: true but amount: null
  - If tip shows a percentage (e.g., "20%"), ignore it (set detected: false)
  - If amount is crossed out and rewritten, use the final (uncrossed) amount
  - Confidence should reflect how clearly the handwriting is readable
  - Set detected: false if no handwritten tip is visible`;
```

### Pattern 2: Pre-fill Decision Logic (Frontend)

**What:** Frontend decides whether to pre-fill based on confidence and amount validity
**When to use:** In Session.tsx after receiving parseReceipt result

```typescript
// In handleReceiptUpload, after successful parse
if (result.handwritten_tip?.detected &&
    result.handwritten_tip.amount !== null &&
    result.handwritten_tip.confidence >= HANDWRITTEN_TIP_CONFIDENCE_THRESHOLD) {
  // Pre-fill tip as manual amount
  await updateTip({
    sessionId: session._id,
    tipType: "manual",
    tipValue: Math.round(result.handwritten_tip.amount * 100), // cents
    participantId: currentParticipantId,
  });
}
// No else - if not detected or low confidence, leave tip field at default (0)
```

### Anti-Patterns to Avoid

- **Inferring tip from total discrepancy:** User decision explicitly says "only use explicit tip line"
- **Processing percentage tips:** User decision says "ignore percentage tips"
- **Showing detection status to user:** User decision says "silent behavior - no toast"
- **Separate API call for tip detection:** Wasteful when Claude can do both in one pass
- **Blocking on handwriting detection failure:** Should fail silently

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Handwriting vs printed classification | Custom image processing | Claude Vision prompt | Claude naturally distinguishes in context |
| Tip amount validation | Regex parsing | Schema with amount field | Structured outputs guarantees valid number |
| Confidence scoring | Heuristics | Ask Claude directly | Model self-assessment is reliable |
| Pre-fill UI | New components | Existing updateTip mutation | TaxTipSettings already handles tip state |

**Key insight:** Claude Vision is excellent at contextual handwriting recognition. Don't try to pre-process or classify images separately. Let Claude make the determination with proper prompt guidance.

## Common Pitfalls

### Pitfall 1: Threshold Too Low for Handwriting
**What goes wrong:** Messy handwriting causes incorrect amounts to be pre-filled
**Why it happens:** Handwriting is inherently harder to read than printed text
**How to avoid:** Use higher threshold (0.8) than for receipt validation (0.7)
**Warning signs:** Users frequently manually correcting pre-filled tip amounts

### Pitfall 2: Confusing Printed Tips with Handwritten
**What goes wrong:** Pre-printed tip suggestions or circled amounts treated as handwritten tips
**Why it happens:** Prompt doesn't clearly distinguish handwritten from printed text
**How to avoid:** Explicit prompt instructions to only detect pen/pencil marks
**Warning signs:** Pre-fills on receipts where customer didn't write anything

### Pitfall 3: Parsing Percentage Tips
**What goes wrong:** "20%" parsed as amount 20.00
**Why it happens:** Percentage symbol not handled
**How to avoid:** Explicitly exclude percentage patterns in prompt
**Warning signs:** Unusually large tip amounts (20, 25, 15)

### Pitfall 4: Not Handling "CASH" or "ON TABLE"
**What goes wrong:** System tries to parse non-numeric tip text
**Why it happens:** These are valid tip entries but not amounts to pre-fill
**How to avoid:** Return detected: true but amount: null for these cases
**Warning signs:** Parse errors or zero tips when customer wrote something

### Pitfall 5: Not Handling Crossed-Out Amounts
**What goes wrong:** Wrong amount used when customer crossed out and rewrote
**Why it happens:** OCR picks up both amounts
**How to avoid:** Prompt explicitly instructs to use final (uncrossed) amount
**Warning signs:** Users reporting wrong tip amounts

## Code Examples

Verified patterns from official sources and existing codebase:

### Extended Schema Definition

```typescript
// Source: Existing parseReceipt.ts pattern + Anthropic structured outputs docs
const handwrittenTipSchema = {
  type: ["object", "null"],
  properties: {
    detected: { type: "boolean" },
    amount: { type: ["number", "null"] },  // null for "CASH"/"ON TABLE"
    confidence: { type: "number" },
    raw_text: { type: "string" }
  },
  required: ["detected", "confidence"],
  additionalProperties: false
};

// Add to existing receiptValidationSchema.properties.data.properties
const extendedDataSchema = {
  // ... existing merchant, items, subtotal, fees, total ...
  handwritten_tip: handwrittenTipSchema
};

// Update required array
required: ["merchant", "items", "subtotal", "fees", "total", "handwritten_tip"]
```

### Prompt Extension

```typescript
// Source: Claude Vision docs + existing parseReceipt.ts pattern
const RECEIPT_VALIDATION_PROMPT = `Analyze this image and determine if it is a receipt...

[existing instructions]

- handwritten_tip: Detect HANDWRITTEN tip amounts on signed receipts
  - Look for pen/pencil marks in the tip or gratuity section
  - Only extract if the writing appears handwritten (not pre-printed)
  - If a dollar amount is written (e.g., "$5", "5.00", "$5.50"):
    - Set detected: true
    - Set amount to the numeric value
    - Set confidence based on handwriting legibility (0.0-1.0)
  - If "CASH", "ON TABLE", or similar text is written:
    - Set detected: true
    - Set amount: null
    - Include raw_text showing what was written
  - If a percentage is written (e.g., "20%"):
    - Set detected: false (we only handle dollar amounts)
  - If amount is crossed out and rewritten:
    - Use the final (uncrossed) value
  - If multiple amounts visible, use the one on the tip line specifically
  - If no handwritten tip visible:
    - Set handwritten_tip: null`;
```

### TypeScript Types

```typescript
// Source: Existing parseReceipt.ts pattern
interface HandwrittenTip {
  detected: boolean;
  amount: number | null;  // null for "CASH"/"ON TABLE"
  confidence: number;
  raw_text?: string;
}

// Extend existing ReceiptValidationResponse
type ReceiptValidationResponse =
  | {
      is_receipt: true;
      confidence: number;
      data: {
        merchant: string | null;
        items: Array<{ name: string; price: number; quantity: number }>;
        subtotal: number | null;
        fees: Array<{ label: string; amount: number }>;
        total: number | null;
        handwritten_tip: HandwrittenTip | null;  // NEW
      };
    }
  | {
      is_receipt: false;
      confidence: number;
      rejection_reason: "landscape_photo" | "screenshot" | "document" | "blurry" | "other";
      description: string;
    };
```

### Frontend Pre-fill Logic

```typescript
// Source: Existing Session.tsx handleReceiptUpload pattern
const HANDWRITTEN_TIP_CONFIDENCE_THRESHOLD = 0.8;

// In handleReceiptUpload, after successful parse and items save
if (result.handwritten_tip?.detected &&
    result.handwritten_tip.amount !== null &&
    result.handwritten_tip.confidence >= HANDWRITTEN_TIP_CONFIDENCE_THRESHOLD) {
  // Pre-fill tip as manual dollar amount
  await updateTip({
    sessionId: session._id,
    tipType: "manual",
    tipValue: Math.round(result.handwritten_tip.amount * 100), // convert to cents
    participantId: currentParticipantId,
  });
}
// Silent - no toast or indicator per user decision
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Dedicated handwriting OCR services | VLM-based detection (Claude, GPT-4V) | 2024-2025 | Single API, no extra dependencies |
| Binary handwriting detection | Confidence-scored extraction | Standard practice | Enables threshold tuning |
| Separate detection + extraction | Combined single-pass | Always preferred | 50% cost/latency reduction |
| Rule-based tip parsing | Prompt-engineered extraction | VLM era | Handles edge cases naturally |

**Current capabilities (2025):**
- Claude Vision ranks #3 for OCR with ELO 1468, noted for handwriting recognition
- Character Error Rate of 2.1% on printed text, comparable on handwriting
- Particularly strong on cursive and varied handwriting styles

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal confidence threshold for handwriting**
   - What we know: Receipt validation uses 0.7, handwriting is harder
   - What's unclear: Real-world distribution of handwriting legibility on receipts
   - Recommendation: Start at 0.8, log confidence scores, tune based on user corrections

2. **Performance with various handwriting styles**
   - What we know: Claude handles most handwriting well
   - What's unclear: Performance on extremely messy/rushed restaurant signatures
   - Recommendation: Test with real-world receipts, watch for patterns in failures

3. **Multi-line tip areas (tip + total both handwritten)**
   - What we know: User decision says trust tip line if conflict with total
   - What's unclear: How Claude handles ambiguous multi-field handwriting
   - Recommendation: Prompt explicitly targets tip line; ignore handwritten totals

## Sources

### Primary (HIGH confidence)
- [Claude Vision Documentation](https://platform.claude.com/docs/en/build-with-claude/vision) - Image handling, best practices
- [Claude Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - JSON schema, beta headers
- Existing codebase: `convex/actions/parseReceipt.ts` - Current OCR implementation

### Secondary (MEDIUM confidence)
- [Handwriting Recognition Benchmarks 2026](https://research.aimultiple.com/handwriting-recognition/) - Claude ranking, ELO scores
- [Top Vision LLMs for OCR 2025](https://docs.docsrouter.com/blog/top-5-vision-llms-for-ocr-in-2025-ranked-by-elo-score) - Performance comparisons
- [Handwriting OCR with AI](https://www.handwritingocr.com/blog/chatgpt-claude-and-ai-for-ocr) - Claude capabilities assessment

### Tertiary (LOW confidence)
- Various receipt OCR providers (Mindee, Veryfi) - General patterns, not directly applicable
- Generic handwriting ML papers - Background context only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing SDK and infrastructure
- Architecture: HIGH - Natural extension of existing parseReceipt pattern
- Prompt patterns: MEDIUM - Based on general VLM prompting, needs validation with real receipts
- Threshold value: LOW - 0.8 is educated guess, needs tuning with production data

**Research date:** 2026-01-19
**Valid until:** 2026-02-19 (30 days - Claude Vision capabilities are stable)

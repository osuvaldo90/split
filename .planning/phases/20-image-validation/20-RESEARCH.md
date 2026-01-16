# Phase 20: Image Validation - Research

**Researched:** 2026-01-16
**Domain:** Claude Vision image classification, prompt engineering for receipt detection
**Confidence:** HIGH

## Summary

Image validation for receipt detection is best implemented as a single-call pattern using Claude Vision with structured outputs. Rather than making two API calls (validate then extract), the recommended approach is to combine validation and extraction in one prompt with a discriminated union response schema. This provides validation feedback while avoiding the latency and cost of multiple calls.

Claude Vision (specifically the model already in use: `claude-sonnet-4-5-20250929`) has excellent image classification capabilities. The structured outputs beta feature (available in SDK 0.69.0+, which the project has at 0.71.2) guarantees schema-compliant responses, eliminating JSON parsing errors. The existing `parseReceipt.ts` architecture can be extended with minimal changes.

**Primary recommendation:** Modify the existing prompt to return a structured response with `is_receipt: boolean` and `confidence: number` fields, using the structured outputs beta. Return a discriminated union: either validation error data or extracted receipt data.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @anthropic-ai/sdk | 0.71.2 | Claude Vision API | Already in use, supports structured outputs beta |
| Claude Sonnet 4.5 | 20250929 | Vision model | Already configured, excellent at classification |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | (add if needed) | Schema validation | TypeScript-native structured output schemas |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single combined call | Two separate API calls (validate then extract) | Two calls doubles latency and cost; single call is sufficient |
| Structured outputs | Manual JSON parsing | Structured outputs guarantee valid JSON, no parsing errors |
| Confidence threshold | Binary classification only | Confidence allows edge case handling and future tuning |

**Installation:**
```bash
# No new packages needed - existing SDK supports structured outputs
# Optionally add Zod for TypeScript schema definitions:
npm install zod
```

## Architecture Patterns

### Recommended Response Structure

The key architectural decision is using a **discriminated union** response type:

```typescript
// Option 1: Receipt detected - return extracted data
{
  is_receipt: true,
  confidence: 0.95,
  data: {
    merchant: "...",
    items: [...],
    subtotal: ...,
    tax: ...,
    gratuity: ...,
    total: ...
  }
}

// Option 2: Not a receipt - return validation error
{
  is_receipt: false,
  confidence: 0.85,
  rejection_reason: "landscape_photo" | "screenshot" | "document" | "unclear" | "other",
  description: "This appears to be a photo of a sunset, not a receipt."
}
```

### Pattern 1: Combined Validation + Extraction (Recommended)

**What:** Single API call that validates AND extracts in one prompt
**When to use:** Always - this is the recommended pattern
**Why:** Avoids double latency/cost, Claude sees image once and makes complete determination

```typescript
// Source: Anthropic Structured Outputs docs
const RECEIPT_VALIDATION_PROMPT = `Analyze this image and determine if it is a receipt.

If it IS a receipt:
- Extract the merchant, items, subtotal, tax, gratuity, and total
- Set is_receipt to true
- Provide your confidence (0.0 to 1.0) that this is a valid receipt

If it is NOT a receipt:
- Set is_receipt to false
- Provide your confidence (0.0 to 1.0) that this is NOT a receipt
- Classify the rejection reason
- Briefly describe what the image appears to be

Return ONLY valid JSON matching the schema.`;
```

### Pattern 2: Separate Validation Call (NOT Recommended)

**What:** First call to validate, second call to extract if valid
**When to use:** Never for this use case
**Why not:** Doubles API cost and latency, no benefit over combined approach

### Anti-Patterns to Avoid

- **Two-step validation then extraction:** Unnecessary API calls, added latency
- **Binary classification without confidence:** Loses information for edge case handling
- **Regex-based JSON extraction:** Use structured outputs instead
- **Hardcoded confidence thresholds in prompt:** Keep thresholds in application code for tuning

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON parsing | Manual JSON.parse with error handling | Structured outputs beta | Guaranteed valid JSON |
| Schema validation | Custom type guards | Zod with structured outputs | Type-safe, auto-validation |
| Confidence scoring | Heuristics based on response text | Ask Claude directly in prompt | Claude's self-assessment is reliable |
| Image type detection | Client-side image analysis | Claude Vision classification | Claude handles edge cases better |

**Key insight:** Claude Vision is excellent at image classification. Don't try to pre-filter images client-side or use heuristics. Let Claude make the determination with a confidence score.

## Common Pitfalls

### Pitfall 1: Threshold Too High or Too Low
**What goes wrong:** Users get frustrated with false rejections, or bad images slip through
**Why it happens:** Confidence thresholds not tuned to real-world data
**How to avoid:** Start with 0.7, log confidence scores in production, tune based on data
**Warning signs:** High support complaints about "valid receipt rejected"

### Pitfall 2: Generic Error Messages
**What goes wrong:** User sees "Invalid image" with no guidance on what to do
**Why it happens:** Not using rejection_reason to provide specific feedback
**How to avoid:** Map rejection reasons to user-friendly messages with recovery actions
**Warning signs:** Users retry with same bad image repeatedly

### Pitfall 3: Not Handling Edge Cases
**What goes wrong:** Partial receipts, receipts with poor lighting, or unusual formats rejected
**Why it happens:** Prompt too strict, confidence threshold too high
**How to avoid:** Test with real-world receipt photos (crumpled, partial, angled)
**Warning signs:** Confidence scores cluster around threshold

### Pitfall 4: Forgetting Existing Error Path
**What goes wrong:** Two different error flows confuse users
**Why it happens:** Adding validation error without updating existing parse error handling
**How to avoid:** Unify error types - validation errors and parse errors use same UI
**Warning signs:** Different error UI for validation vs parse failures

### Pitfall 5: Blocking on Low Confidence
**What goes wrong:** Legitimate receipts blocked because confidence is 0.65
**Why it happens:** Binary accept/reject instead of allowing override
**How to avoid:** Consider "low confidence" path that warns but allows retry or override
**Warning signs:** Support requests showing legitimate receipts with confidence 0.5-0.7

## Code Examples

Verified patterns from official sources:

### Structured Output with Discriminated Union

```typescript
// Source: Anthropic Structured Outputs docs + Vision docs
import Anthropic from "@anthropic-ai/sdk";

// Define the response schema
const receiptValidationSchema = {
  type: "object",
  properties: {
    is_receipt: { type: "boolean" },
    confidence: { type: "number" },
    // Present when is_receipt is true
    data: {
      type: "object",
      properties: {
        merchant: { type: ["string", "null"] },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              price: { type: "number" },
              quantity: { type: "number" }
            },
            required: ["name", "price", "quantity"],
            additionalProperties: false
          }
        },
        subtotal: { type: ["number", "null"] },
        tax: { type: ["number", "null"] },
        gratuity: { type: ["number", "null"] },
        total: { type: ["number", "null"] }
      },
      required: ["merchant", "items", "subtotal", "tax", "gratuity", "total"],
      additionalProperties: false
    },
    // Present when is_receipt is false
    rejection_reason: {
      type: "string",
      enum: ["landscape_photo", "screenshot", "document", "blurry", "other"]
    },
    description: { type: "string" }
  },
  required: ["is_receipt", "confidence"],
  additionalProperties: false
};

// Make the API call with structured outputs
const response = await anthropic.beta.messages.create({
  model: "claude-sonnet-4-5-20250929",
  max_tokens: 2048,
  betas: ["structured-outputs-2025-11-13"],
  messages: [
    {
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
          text: RECEIPT_VALIDATION_PROMPT,
        },
      ],
    },
  ],
  output_format: {
    type: "json_schema",
    schema: receiptValidationSchema,
  },
});

// Parse response - guaranteed valid JSON
const result = JSON.parse(response.content[0].text);
```

### User-Friendly Error Messages

```typescript
// Map rejection reasons to user-facing messages
const REJECTION_MESSAGES: Record<string, { title: string; hint: string }> = {
  landscape_photo: {
    title: "This doesn't look like a receipt",
    hint: "Try taking a photo of your receipt instead"
  },
  screenshot: {
    title: "Screenshots aren't supported",
    hint: "Please take a photo of the physical receipt"
  },
  document: {
    title: "This looks like a document, not a receipt",
    hint: "Make sure you're photographing a store receipt"
  },
  blurry: {
    title: "The image is too blurry",
    hint: "Try taking another photo with better lighting"
  },
  other: {
    title: "We couldn't recognize this as a receipt",
    hint: "Try taking a clearer photo of your receipt"
  }
};
```

### Response Type Definition

```typescript
// TypeScript types for the validation response
type ReceiptValidationResult =
  | {
      is_receipt: true;
      confidence: number;
      data: {
        merchant: string | null;
        items: Array<{ name: string; price: number; quantity: number }>;
        subtotal: number | null;
        tax: number | null;
        gratuity: number | null;
        total: number | null;
      };
    }
  | {
      is_receipt: false;
      confidence: number;
      rejection_reason: "landscape_photo" | "screenshot" | "document" | "blurry" | "other";
      description: string;
    };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual JSON.parse with try/catch | Structured outputs beta | 2025-11 | Guaranteed valid JSON |
| Two-step validate then extract | Single combined call | Always preferred | 50% cost/latency reduction |
| Binary classification | Classification with confidence | Standard practice | Enables threshold tuning |
| Generic error messages | Reason-specific guidance | UX best practice | Better user experience |

**Deprecated/outdated:**
- The `claude-3-5-sonnet-20241022` model references seen in older code - use `claude-sonnet-4-5-20250929` which is already configured

## Open Questions

Things that couldn't be fully resolved:

1. **Optimal confidence threshold**
   - What we know: 0.7 is a reasonable starting point based on general classification tasks
   - What's unclear: Ideal threshold depends on real receipt photo quality distribution
   - Recommendation: Start at 0.7, log confidence scores, tune after collecting production data

2. **Handling partial/crumpled receipts**
   - What we know: Claude handles imperfect images reasonably well
   - What's unclear: Edge case behavior with severely damaged receipts
   - Recommendation: Test with real-world edge cases, consider "low confidence" warning path

3. **Structured outputs beta stability**
   - What we know: Feature is in public beta since Nov 2025, supported in SDK 0.69.0+
   - What's unclear: Timeline to GA
   - Recommendation: Use it - the project already uses beta features (Convex)

## Sources

### Primary (HIGH confidence)
- [Claude Vision Documentation](https://platform.claude.com/docs/en/build-with-claude/vision) - Image handling, placement, limits
- [Claude Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) - JSON schema, beta headers, SDK helpers
- [Prompting Best Practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-4-best-practices) - Image-before-text, XML tags

### Secondary (MEDIUM confidence)
- [Error Handling UX Patterns](https://www.pencilandpaper.io/articles/ux-pattern-analysis-error-feedback) - Retry UX, inline validation
- [Mobile Forms Error Best Practices](https://www.uxpin.com/studio/blog/error-feedback-best-practices-mobile-forms/) - Mobile error handling

### Tertiary (LOW confidence)
- Various blog posts on VLM prompting - general patterns, not Claude-specific

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing SDK, official docs verify features
- Architecture: HIGH - Single-call pattern is documented best practice
- Pitfalls: MEDIUM - Based on general classification experience, not receipt-specific data

**Research date:** 2026-01-16
**Valid until:** 2026-02-16 (30 days - structured outputs is stable beta)

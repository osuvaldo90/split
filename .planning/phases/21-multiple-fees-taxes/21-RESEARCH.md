# Phase 21: Multiple Fees/Taxes - Research

**Researched:** 2026-01-17
**Domain:** Convex schema migration, prompt engineering for fee extraction
**Confidence:** HIGH

## Summary

This phase migrates from a single `tax` field on sessions to a separate `fees` table that supports multiple named fees/taxes. The user has decided that all fees use the exact labels from receipts (e.g., "Philadelphia Sales Tax", "Kitchen Appreciation Fee") without normalization, and all fees distribute proportionally like the current tax behavior.

The implementation requires:
1. A new `fees` table in Convex schema
2. Updated parseReceipt prompt to extract multiple labeled fees
3. Migration of existing `tax` field data to the new structure
4. UI updates to show/edit multiple fees in the TaxTipSettings component

**Primary recommendation:** Add a `fees` table with `sessionId`, `label`, and `amount` fields. Keep existing `tax` field as optional during migration. Use structured outputs to guarantee the LLM returns an array of fees with exact labels.

## Standard Stack

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Convex | 1.31.4 | Backend database and real-time sync | Already in use, schema changes are straightforward |
| @anthropic-ai/sdk | 0.71.2 | Claude Vision API for receipt parsing | Already in use with structured outputs beta |

### Supporting (No New Dependencies Needed)
The existing stack handles all requirements. No new libraries needed.

**Installation:** None required - all dependencies already present.

## Architecture Patterns

### Recommended Schema Design

```typescript
// convex/schema.ts - ADD new fees table
fees: defineTable({
  sessionId: v.id("sessions"),
  label: v.string(),        // Exact text from receipt (e.g., "Philadelphia Liquor Tax")
  amount: v.number(),       // Amount in cents
})
  .index("by_session", ["sessionId"]),
```

**Rationale:**
- Separate table rather than array in sessions because Convex queries work better with normalized data
- Individual fees can be added/removed/updated independently
- Index on sessionId enables efficient queries
- Mirrors the existing `items` table pattern which is well-established in this codebase

### Session Schema Update

```typescript
// Keep existing tax field as optional during migration
sessions: defineTable({
  // ... existing fields ...
  tax: v.optional(v.number()),         // DEPRECATED: use fees table
  // DO NOT add new fee-related fields here
})
```

**Migration Strategy:**
1. Add `fees` table to schema (no breaking change)
2. Update code to read from `fees` table, fall back to `tax` field
3. Update parseReceipt to write to `fees` table
4. Create migration to convert existing `tax` values to fee records
5. Eventually remove `tax` field (future phase, not this one)

### Pattern 1: Dual-Read Pattern for Migration

**What:** Read from new structure, fall back to old structure
**When to use:** During schema migration when old data must continue working
**Example:**
```typescript
// In getTotals query
const fees = await ctx.db
  .query("fees")
  .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
  .collect();

// Calculate total fees
let totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);

// Fall back to legacy tax field if no fees exist
if (fees.length === 0 && session.tax) {
  totalFees = session.tax;
}
```

### Pattern 2: Fee CRUD Operations

**What:** Mirror the items.ts pattern for fee management
**When to use:** For all fee operations (add, update, remove)
**Example:**
```typescript
// fees.ts - following items.ts pattern
export const add = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    label: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify participant is host
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can add fees");
    }
    // ... validation and insert
  },
});
```

### Anti-Patterns to Avoid

- **Storing fees as JSON array in sessions:** Makes individual updates expensive and complicates queries
- **Normalizing fee labels:** User explicitly decided to keep receipt-specific labels
- **Different distribution rules per fee type:** User decided all fees distribute proportionally

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema migration tracking | Custom migration state | Convex's migration component or manual approach | This is a simple add-field migration that doesn't need tracking |
| Fee distribution math | New calculation functions | Existing `distributeWithRemainder` | Already handles proportional distribution with remainder handling |
| Structured JSON from LLM | Manual JSON parsing with try/catch | Structured outputs beta | Already in use, guarantees valid JSON |

**Key insight:** The existing `distributeWithRemainder` function in `calculations.ts` handles proportional distribution perfectly. Just call it once per fee to distribute each fee's total across participants.

## Common Pitfalls

### Pitfall 1: Breaking Existing Sessions During Migration

**What goes wrong:** Existing sessions with `tax` field stop working when code expects `fees` table
**Why it happens:** Code updated before data migrated
**How to avoid:**
- Always check `fees` table first, fall back to `tax` field
- Keep `tax` field optional (not removed) during migration period
- Test with both old sessions (tax only) and new sessions (fees table)
**Warning signs:** Errors in production for existing sessions after deployment

### Pitfall 2: Rounding Errors in Multi-Fee Distribution

**What goes wrong:** Sum of distributed fees doesn't match total fees
**Why it happens:** Each fee distributed independently can accumulate rounding errors
**How to avoid:**
- Use `distributeWithRemainder` for each fee individually (not combined total)
- Accept that sums may differ by a few cents from receipt total
- Display individual fee breakdown, not re-summed total
**Warning signs:** UI shows different totals than receipt

### Pitfall 3: Prompt Engineering for Variable Fee Formats

**What goes wrong:** LLM doesn't extract all fees or uses wrong labels
**Why it happens:** Receipts vary wildly in how they label fees/taxes
**How to avoid:**
- Give explicit examples of fee line items in the prompt
- Use descriptive field names in the schema
- Test with diverse receipt samples
**Warning signs:** Missing fees, generic labels like "Tax 1", "Tax 2"

### Pitfall 4: UI State Sync with Multiple Editable Fees

**What goes wrong:** Editing one fee causes flickering or stale data in other fees
**Why it happens:** React state not properly synchronized with Convex real-time updates
**How to avoid:**
- Follow existing TaxTipSettings pattern: local state for editing, sync on blur
- Use unique keys for each fee row
- Don't optimistically update - let Convex reactivity handle it
**Warning signs:** UI flickers, edits lost, values jumping

## Code Examples

### Updated JSON Schema for Receipt Parsing

```typescript
// Source: Existing parseReceipt.ts pattern + structured outputs docs
const receiptValidationSchema = {
  type: "object",
  properties: {
    is_receipt: { type: "boolean" },
    confidence: { type: "number" },
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
              quantity: { type: "number" },
            },
            required: ["name", "price", "quantity"],
            additionalProperties: false,
          },
        },
        subtotal: { type: ["number", "null"] },
        // CHANGED: fees array instead of single tax
        fees: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },   // Exact text from receipt
              amount: { type: "number" },   // In dollars
            },
            required: ["label", "amount"],
            additionalProperties: false,
          },
        },
        gratuity: { type: ["number", "null"] },
        total: { type: ["number", "null"] },
      },
      required: ["merchant", "items", "subtotal", "fees", "gratuity", "total"],
      additionalProperties: false,
    },
    rejection_reason: {
      type: "string",
      enum: ["landscape_photo", "screenshot", "document", "blurry", "other"],
    },
    description: { type: "string" },
  },
  required: ["is_receipt", "confidence"],
  additionalProperties: false,
} as const;
```

### Updated Prompt for Fee Extraction

```typescript
// Key additions to RECEIPT_VALIDATION_PROMPT
const FEE_EXTRACTION_GUIDANCE = `
- fees: Extract ALL tax and fee line items from the receipt as an array
  - Each fee should have:
    - label: The EXACT text from the receipt (e.g., "Philadelphia Sales Tax", "Kitchen Appreciation Fee", "Liquor Tax")
    - amount: The dollar amount for that fee
  - Include all types: sales tax, liquor tax, service fees, gratuity charges, surcharges, etc.
  - If the receipt shows a single "Tax" line, use label "Tax"
  - If no taxes/fees are visible, return an empty array []
  - Do NOT combine multiple fees into one - keep them separate
  - Examples of fee labels you might see:
    - "Sales Tax", "PA Sales Tax", "Philadelphia Sales Tax"
    - "Liquor Tax", "Philadelphia Liquor Tax", "Alcohol Tax"
    - "Kitchen Appreciation Fee", "Service Fee", "Service Charge"
    - "Gratuity", "Auto Gratuity", "18% Gratuity"
`;
```

### Fee Distribution in getTotals

```typescript
// In participants.ts getTotals query
// Replace single tax distribution with multiple fees

const fees = await ctx.db
  .query("fees")
  .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
  .collect();

// Calculate total fees for each participant
const participantFeeShares = new Map<Id<"participants">, number>();
for (const p of participants) {
  participantFeeShares.set(p._id, 0);
}

// Distribute each fee proportionally
for (const fee of fees) {
  const feeShares = distributeWithRemainder(fee.amount, allSubtotals);
  // Add to each participant's fee share
  for (let i = 0; i < participants.length; i++) {
    const current = participantFeeShares.get(participants[i]._id) || 0;
    participantFeeShares.set(participants[i]._id, current + feeShares[i]);
  }
}

// Fall back to legacy tax field if no fees
if (fees.length === 0 && session.tax) {
  const taxShares = distributeWithRemainder(session.tax, allSubtotals);
  for (let i = 0; i < participants.length; i++) {
    participantFeeShares.set(participants[i]._id, taxShares[i]);
  }
}
```

### Fees CRUD Mutations

```typescript
// convex/fees.ts - following items.ts pattern
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateMoney } from "./validation";

export const listBySession = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fees")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

export const add = mutation({
  args: {
    sessionId: v.id("sessions"),
    participantId: v.id("participants"),
    label: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can add fees");
    }
    if (participant.sessionId !== args.sessionId) {
      throw new Error("Participant not in this session");
    }

    const validatedAmount = validateMoney(args.amount, "Fee amount");
    const label = args.label.trim();
    if (!label || label.length > 100) {
      throw new Error("Fee label must be 1-100 characters");
    }

    return await ctx.db.insert("fees", {
      sessionId: args.sessionId,
      label,
      amount: validatedAmount,
    });
  },
});

export const update = mutation({
  args: {
    feeId: v.id("fees"),
    participantId: v.id("participants"),
    label: v.optional(v.string()),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const fee = await ctx.db.get(args.feeId);
    if (!fee) throw new Error("Fee not found");

    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can update fees");
    }
    if (participant.sessionId !== fee.sessionId) {
      throw new Error("Participant not in this session");
    }

    const updates: Record<string, unknown> = {};
    if (args.label !== undefined) {
      const label = args.label.trim();
      if (!label || label.length > 100) {
        throw new Error("Fee label must be 1-100 characters");
      }
      updates.label = label;
    }
    if (args.amount !== undefined) {
      updates.amount = validateMoney(args.amount, "Fee amount");
    }

    await ctx.db.patch(args.feeId, updates);
  },
});

export const remove = mutation({
  args: {
    feeId: v.id("fees"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const fee = await ctx.db.get(args.feeId);
    if (!fee) throw new Error("Fee not found");

    const participant = await ctx.db.get(args.participantId);
    if (!participant || !participant.isHost) {
      throw new Error("Only the host can remove fees");
    }
    if (participant.sessionId !== fee.sessionId) {
      throw new Error("Participant not in this session");
    }

    await ctx.db.delete(args.feeId);
  },
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `tax` field | `fees` table | This phase | Multiple fees supported, individual editing |
| Tax labeled generically | Receipt-exact labels | This phase | User sees "Philadelphia Liquor Tax" not just "Tax" |

**Deprecated/outdated:**
- `sessions.tax` field: Will be deprecated after migration. Keep reading from it for backwards compatibility, but stop writing to it.

## Open Questions

1. **Bulk add fees from OCR**
   - What we know: Need to add multiple fees at once after receipt parsing
   - What's unclear: Should we have an `addBulk` mutation like items, or add individually?
   - Recommendation: Add `addBulk` mutation for efficiency - follows items.ts pattern

2. **Empty fees array display**
   - What we know: User can manually add fees even without receipt
   - What's unclear: Should we show "No fees" placeholder or just empty section?
   - Recommendation: Show "Add a fee" button when empty, consistent with items pattern

3. **Fee label validation**
   - What we know: Labels should be receipt-exact text
   - What's unclear: Max length? Special character handling?
   - Recommendation: 100 char max, allow any printable characters

## Sources

### Primary (HIGH confidence)
- Convex schema docs: https://docs.convex.dev/database/schemas - Table definitions, optional fields, indexes
- Convex migrations guide: https://stack.convex.dev/intro-to-migrations - Online migration best practices
- Anthropic structured outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs - JSON schema format, array support

### Secondary (MEDIUM confidence)
- Convex lightweight migrations: https://stack.convex.dev/lightweight-zero-downtime-migrations - Dashboard bulk edit approach

### Tertiary (LOW confidence)
- Receipt tax types research: WebSearch only - various tax types on restaurant bills

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing dependencies with well-understood patterns
- Architecture: HIGH - Following established patterns in codebase (items table, calculations)
- Pitfalls: HIGH - Based on documented Convex migration patterns and existing code review
- Prompt engineering: MEDIUM - Receipt formats vary, will need iteration with real receipts

**Research date:** 2026-01-17
**Valid until:** 2026-02-17 (stable domain, Convex patterns well-established)

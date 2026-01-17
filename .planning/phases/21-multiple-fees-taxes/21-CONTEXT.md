# Phase 21: Multiple Fees/Taxes - Context

**Gathered:** 2026-01-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract and classify multiple fees/taxes from receipts, display them in a unified taxes/fees section, and distribute them proportionally to participants. This phase handles the schema migration from the current single tax field to multiple fees.

</domain>

<decisions>
## Implementation Decisions

### Tax/Fee Classification
- Use receipt-specific labels exactly as printed (e.g., "Kitchen Appreciation Fee", "Philadelphia Sales Tax", "Philadelphia Liquor Tax")
- LLM extracts the exact text from the receipt for each fee
- No generic category normalization — preserve original terminology

### UI Display
- Two sections on the tax/tip screen: "Taxes & Fees" section and "Tip" section
- Each fee shown as individual line item with its label and amount
- No subtotal line within the fees section — individual fees only
- All fees are editable — user can adjust amounts if OCR got it wrong
- User can add and remove fees (similar to how items work)
- Section header: "Taxes & Fees"

### Distribution Logic
- All fees distribute proportionally to items (same as current tax behavior)
- All fee types use the same distribution rule — no per-fee configuration
- Liquor tax treated like any other fee (proportional to total, not alcohol-only)
- Participant share view shows breakdown: rename "Tax" to "Taxes & Fees"

### Data Migration
- Migrate existing single "Tax" field to new fees schema
- Existing sessions keep their data as one fee in the new structure

### Claude's Discretion
- Schema design for multiple fees in Convex
- Migration strategy implementation details
- Exact UI component structure and styling

</decisions>

<specifics>
## Specific Ideas

- Reference receipt (Philadelphia): Shows three distinct fees — Kitchen Appreciation Fee (1.5%), Philadelphia Sales Tax (8%), Philadelphia Liquor Tax (10%)
- Fees work like items: add, remove, edit individually
- Keep breakdown visible in participant share view (items + taxes/fees + tip = total)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 21-multiple-fees-taxes*
*Context gathered: 2026-01-17*

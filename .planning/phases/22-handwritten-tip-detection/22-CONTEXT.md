# Phase 22: Handwritten Tip Detection - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Detect handwritten tip amounts on signed receipts and pre-fill the tip field automatically. User can always manually adjust after pre-fill. This phase does not add new UI components — it enhances the existing OCR flow to extract tip amounts when present.

</domain>

<decisions>
## Implementation Decisions

### Detection confidence
- Only pre-fill when detection confidence is high — skip pre-fill if uncertain
- Silent behavior — no toast or indicator when tip is/isn't detected
- Pre-fill even if amount seems unreasonable (user can edit)
- Always attempt detection on every receipt (don't require signature detection first)

### Tip format handling
- Ignore percentage tips (e.g., "20%") — only detect dollar amounts
- Accept any numeric format: "10", "$10", "10.00", "$10.00" all work
- If amount is crossed out/corrected, use the final (uncrossed) amount
- Recognize "CASH" or "ON TABLE" as "no tip to pre-fill" — leave tip field empty

### Total line interpretation
- Only use explicit tip line — do not infer tip from (handwritten total - subtotal)
- If tip line and total line conflict, trust the tip line
- Ignore pre-printed tip suggestions even if circled — only detect handwritten amounts
- No validation that tip + subtotal = total — just extract the tip

### Claude's Discretion
- Confidence threshold value
- Handwriting recognition prompt patterns
- How to distinguish handwritten from printed text

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-handwritten-tip-detection*
*Context gathered: 2026-01-19*

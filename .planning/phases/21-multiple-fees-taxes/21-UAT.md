---
status: complete
phase: 21-multiple-fees-taxes
source: 21-01-SUMMARY.md, 21-02-SUMMARY.md, 21-03-SUMMARY.md
started: 2026-01-17T23:00:00Z
updated: 2026-01-19T16:23:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Multiple Fees Display in Summary
expected: After scanning a receipt with multiple tax/fee lines, the Summary section shows "Taxes & Fees" label with the combined total.
result: pass

### 2. Individual Fee Labels Preserved
expected: Each fee extracted from the receipt keeps its exact label from the receipt (e.g., "Sales Tax", "Liquor Tax", "Service Fee") visible in the settings.
result: pass

### 3. Host Can View Fee List
expected: Host can see a list of all extracted fees with their labels and amounts in TaxTipSettings.
result: pass

### 4. Host Can Edit Fee Amount
expected: Host can tap/click a fee amount, change it, and the change is saved when blurring out of the field.
result: pass

### 5. Host Can Add New Fee
expected: Host can add a new fee line item. The label input is automatically focused for immediate editing.
result: pass

### 6. Host Can Remove Fee
expected: Host can remove a fee line item from the list.
result: pass

### 7. Fee Distribution to Participants
expected: Multiple fees are distributed proportionally to participants based on their item totals. Each participant's share reflects their portion of all fees combined.
result: pass

### 8. Backward Compatibility
expected: Existing sessions created before this feature (with single tax field) continue to display and calculate correctly.
result: pass
resolved: "Plan 21-03 added displayFees computation with session.tax fallback. Legacy sessions now show synthetic 'Tax' fee in TaxTipSettings as read-only."

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

None - all gaps closed by Plan 21-03.

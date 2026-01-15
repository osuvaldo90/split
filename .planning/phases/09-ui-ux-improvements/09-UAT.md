---
status: diagnosed
phase: 09-ui-ux-improvements
source: 09-01-SUMMARY.md
started: 2026-01-15T05:30:00Z
updated: 2026-01-15T05:35:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Unified Receipt Upload Button
expected: Single "Add Receipt" button replaces old "Take Photo"/"Upload Image" buttons. Tapping opens OS file picker with camera option available.
result: issue
reported: "on android the 'add receipt' button only shows a photo picker and doesn't give me an option to use the camera."
severity: major

### 2. InlineItem Edit Layout
expected: Editing a line item shows stacked 3-row layout (name, price/qty/delete, cancel/save). Layout stays stacked on all devices.
result: issue
reported: "yes, but it looks wonky and i think it could have a cleaner, better aligned ui"
severity: cosmetic

### 3. Auto-Decimal Price Formatting
expected: In edit mode, typing "5" in price field and blurring formats it to "5.00".
result: pass

### 4. Reduced Vertical Spacing
expected: Session page feels more compact - less empty space between sections while maintaining touch-friendly button sizes.
result: skipped
reason: User deferred - can ignore for now

## Summary

total: 4
passed: 1
issues: 2
pending: 0
skipped: 1

## Issues for /gsd:plan-fix

- UAT-001: Android receipt button shows only photo picker, no camera option (major) - Test 1
  root_cause: Using `accept="image/*"` alone doesn't trigger camera option on Android. Need `capture="environment"` attribute on the file input, OR provide separate camera button. iOS handles this automatically but Android requires explicit capture attribute.

- UAT-002: Edit layout looks wonky, needs cleaner alignment (cosmetic) - Test 2
  root_cause: Row 2 layout has inconsistent spacing - price input uses flex-1 spacer pushing delete far right, $ prefix and input not visually grouped, overall alignment feels unbalanced. Need to constrain row width or better align the price/delete elements.

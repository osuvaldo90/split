---
created: 2026-01-14T23:59
title: Fix inline item edit mode layout overflow
area: ui
files:
  - src/components/InlineItem.tsx
---

## Problem

The inline item edit mode has layout issues on both mobile and desktop:

**Mobile:** Text inputs and buttons wrap to multiple lines, making the edit form tall and awkward. The name input, price input with $ prefix, delete button, Cancel button, and Save button all stack vertically when they should fit more compactly.

**Desktop:** The Cancel and Save buttons overflow outside the right edge of the container (past the vertical bar), breaking the contained layout.

Screenshots show:
- Mobile: Inputs stacked vertically with large buttons below
- Desktop: "Cancel" and "Save" buttons extend beyond the max-width container

## Solution

TBD - Options to consider:
1. Stack layout: Name input on first row, price/delete on second row, buttons on third row (consistent mobile/desktop)
2. Responsive layout: Single row on desktop with smaller inputs, stack on mobile
3. Reduce button size and use icons instead of text labels
4. Use a modal/popover for editing instead of inline expansion

Need to balance compactness with touch-friendly targets on mobile.

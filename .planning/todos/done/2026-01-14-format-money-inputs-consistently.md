---
created: 2026-01-14T14:47
title: Format money inputs consistently
area: ui
files:
  - src/components/ItemEditor.tsx
  - src/components/ReceiptReview.tsx
---

## Problem

In the edit/confirm screen for receipt items, money values display inconsistently. A value like $4.80 shows as "4.8" instead of "4.80". This looks unprofessional and could confuse users about the actual amount.

Expected: All money values should display with exactly 2 decimal places (e.g., "$4.80", "$10.00", "$123.45").

## Solution

Create or use a consistent money formatting utility:
1. When displaying prices: always show 2 decimal places
2. When editing: input can be flexible but display should format on blur
3. Consider using `toFixed(2)` or a proper currency formatter like `Intl.NumberFormat`

TBD: Check if there's already a formatting utility in the codebase to reuse.

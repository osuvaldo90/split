---
created: 2026-01-14T14:43
title: Split quantity items into separate lines
area: api
files:
  - convex/actions/parseReceipt.ts
---

## Problem

When a receipt has multiple items on one line with a quantity (e.g., "2 Bitburger Pilsner $13"), the OCR returns it as a single item at $13. This is incorrect for bill splitting — it should be interpreted as 2 separate items at $6.50 each, so different people can claim individual items.

Common patterns:
- "2 Bitburger Pilsner    $13.00" → should become 2x "Bitburger Pilsner" at $6.50
- "3x Fish Tacos $24" → should become 3x "Fish Tacos" at $8.00
- "Nachos (2) $18" → should become 2x "Nachos" at $9.00

## Solution

Update the receipt parsing prompt/logic to:
1. Detect quantity indicators (leading number, "x", parenthetical count)
2. Split into individual line items with divided price
3. Ensure the math adds up correctly (handle rounding for odd divisions)

TBD: Decide on rounding strategy for prices that don't divide evenly (e.g., $13 ÷ 2 = $6.50, but $10 ÷ 3 = $3.33... with penny leftover)

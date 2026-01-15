---
created: 2026-01-14T16:12
title: Auto-insert decimal when editing item price
area: ui
files:
  - src/components/ItemEditor.tsx
  - src/components/ReceiptReview.tsx
---

## Problem

When editing a price, users must manually type the decimal point. For a bill-splitting app used at restaurants, speed matters. Typing "545" should automatically become "$5.45" rather than requiring the user to type "5.45".

This is how many POS systems and payment apps work - they assume cents-first entry and auto-format.

## Solution

Option 1: Cents-first input (like ATM/POS)
- User types digits only: "545" → displays as "$5.45"
- Input is always treated as cents, divided by 100 for display
- Simpler for users who don't need to think about decimal placement

Option 2: Smart decimal insertion
- If no decimal present, insert before last 2 digits on blur
- More flexible but slightly more complex

TBD: Decide which approach feels more natural for the use case. Test with actual receipt editing flow.

---
created: 2026-01-14T00:01
title: Better UX for multiple items in one line item
area: ui
files:
  - src/components/InlineItem.tsx
---

## Problem

When a receipt has multiple quantities of the same item (e.g., "2x Burger $24.00"), the current UI/UX for handling this is unclear. Users may need to:
- Split the line item into individual items for separate claiming
- Understand that claiming a multi-item line gives them all items
- Have a way to indicate they only want some of the quantity

## Solution

TBD - Options to explore:
- Display quantity prominently on multi-item lines
- Allow splitting line items into individual items
- Support partial claiming (e.g., claim 1 of 2 burgers)
- Provide visual indicator for quantity > 1

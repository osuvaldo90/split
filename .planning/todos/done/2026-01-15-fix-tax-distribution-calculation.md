---
created: 2026-01-15T12:00
title: Fix tax distribution calculation
area: api
files:
  - convex/participants.ts
---

## Problem

The tax owed calculation may be incorrect. Currently tax is distributed proportionally, but it should be proportional to the subtotal based on the total of the items the user claimed (their share of the bill subtotal), not just even distribution.

Need to verify:
1. How tax is currently being distributed in `getTotals` query
2. Whether it's proportional to each participant's claimed items subtotal
3. If not, fix to use correct proportional calculation

## Solution

Review `convex/participants.ts` getTotals query. Tax distribution should be:
`participant_tax = total_tax * (participant_subtotal / bill_subtotal)`

This ensures someone who ordered $50 of a $100 bill pays 50% of the tax.

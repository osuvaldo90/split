---
created: 2026-01-14T14:41
title: Detect auto-gratuity on receipts
area: api
files:
  - convex/actions/parseReceipt.ts
---

## Problem

When a receipt includes an auto-gratuity (common for larger parties), the OCR/parsing logic does not detect or extract it. This means the app doesn't account for tips that were already added to the bill, which could lead to users double-tipping or incorrect total calculations.

Auto-gratuity can appear on receipts as:
- "Gratuity"
- "Auto Gratuity"
- "Service Charge"
- "Tip (18%)" or similar pre-filled lines

## Solution

Update the receipt parsing logic in `parseReceipt.ts` to:
1. Detect auto-gratuity/service charge line items
2. Return them as a separate field (e.g., `autoGratuity`) alongside items, subtotal, tax, total
3. UI should display detected auto-gratuity and factor it into tip calculations (possibly skip tip or show warning)

TBD: Exact prompt changes and schema updates needed.

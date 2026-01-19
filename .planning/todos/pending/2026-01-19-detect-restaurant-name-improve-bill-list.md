---
created: 2026-01-19T12:00
title: Detect restaurant name and improve bill list UI
area: api
files:
  - src/api/scan.ts
  - src/components/BillList.tsx
---

## Problem

The bill list currently shows bills without restaurant names, making it hard for users to identify which bill is which when they have multiple sessions. The OCR system already scans receipts but doesn't extract the restaurant/business name.

Users need to quickly identify their bills by restaurant name rather than relying on dates or bill IDs alone.

## Solution

1. **API**: Extend the receipt scanning prompt to extract restaurant/business name from the receipt header
2. **Database**: Add `restaurantName` field to bill schema
3. **UI**: Display restaurant name prominently in the bill list items

TBD: Confidence threshold for restaurant name extraction, fallback display when name not detected.

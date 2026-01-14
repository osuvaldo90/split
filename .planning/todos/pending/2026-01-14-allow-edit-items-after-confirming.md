---
created: 2026-01-14T16:14
updated: 2026-01-14T22:35
title: Remove confirm step, inline item editing for all users
area: ui
files:
  - src/pages/Session.tsx
  - src/components/ReceiptReview.tsx
---

## Problem

Current flow has a separate "confirm" step after receipt scan. This adds friction:
- Users must explicitly confirm before items appear in the session
- Once confirmed, items can't be easily edited
- Only the session creator can add/modify items

In a real restaurant scenario:
- OCR often gets items wrong
- Anyone at the table might notice mistakes
- Need quick inline corrections without modal/confirm flows

## Solution

Remove the confirm step entirely. After receipt scan:
1. Items appear directly in the regular session view
2. Each item has an edit button for inline correction (name, price)
3. "Add Item" button is always present for ALL users (not just host)
4. Any participant can fix mistakes they notice

This creates a more collaborative, fluid experience matching how people actually split bills at a restaurant.

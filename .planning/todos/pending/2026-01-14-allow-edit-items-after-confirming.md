---
created: 2026-01-14T16:14
title: Allow user to edit items after confirming
area: ui
files:
  - src/pages/Session.tsx
  - src/components/ReceiptReview.tsx
---

## Problem

Currently, once a user confirms items from a receipt scan, they cannot edit them. If someone notices a mistake (wrong price, missing item, typo in name), they're stuck with the incorrect data.

In a real restaurant scenario:
- Receipts often get OCR'd incorrectly
- Users realize mistakes only after seeing the full list
- Need ability to correct items without re-scanning

## Solution

Add an "Edit Items" button or mode to the session view that:
1. Shows the confirmed items in editable form (reuse ItemEditor component)
2. Allows adding/removing/modifying items
3. Saves changes back to the database

TBD:
- Where should the edit button live in the UI?
- Should editing be inline or open a modal/separate view?
- Who can edit: only session creator or any participant?

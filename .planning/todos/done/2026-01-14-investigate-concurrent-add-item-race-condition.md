---
created: 2026-01-14T20:40
title: Fix new item broadcast to other users before save
area: ui
files:
  - src/pages/Session.tsx
  - convex/items.ts
---

## Problem

When a user clicks "Add Item", the new empty item is immediately broadcast to other users in the session:
- User A clicks "Add Item" → new empty editable item appears for User A
- Before User A has entered any data or saved, other users see an empty editable item appear in their view
- This creates confusion — other users see an item they didn't create, in edit mode, with no content

The item should only be visible to other users after it has been saved with actual content.

## Solution

TBD — possible approaches:
1. Don't create the item in the database until the user saves (local-only until confirmed)
2. Add a "draft" or "pending" status that filters items from other users' views
3. Use optimistic UI for the creator but delay the actual mutation until save
4. Add a "creatorId" check to only show unsaved items to their creator

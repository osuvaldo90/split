---
created: 2026-01-14T16:08
title: Investigate concurrent add item race condition
area: ui
files:
  - src/pages/Session.tsx
  - convex/items.ts
---

## Problem

Potential race condition when multiple users click "Add Item" simultaneously in a session:
- User A clicks Add Item → creates new item with empty name
- User B clicks Add Item at same time → may create another item OR overwrite User A's item

This needs testing to confirm the behavior. In a real-time collaborative app with multiple participants, concurrent actions on shared data need careful handling.

## Solution

TBD — needs investigation first:
1. Test with two browser windows in same session
2. Click "Add Item" in both at nearly the same time
3. Observe what happens — do both items appear? Does one get lost?
4. If race condition confirmed, fix may involve:
   - Optimistic UI with unique temp IDs
   - Server-side conflict resolution
   - Different mutation pattern

---
created: 2026-01-14T14:50
title: Improve item count input UX
area: ui
files:
  - src/components/ItemEditor.tsx
---

## Problem

In the item editing UI, when changing the item count from 2 to 1, the count input disappears and becomes un-editable. This is confusing — users should always be able to see and edit the count.

Current behavior: Count input hides when count = 1
Expected behavior: Count input should always be visible and editable

## Solution

Defer the full item count UI/UX redesign to a later phase. For now, this is a known limitation.

Potential future approaches:
- Always show count input (even when 1)
- Use stepper buttons (+/-) instead of direct input
- Better visual treatment for single vs multiple items

Marked as deferred per user request.

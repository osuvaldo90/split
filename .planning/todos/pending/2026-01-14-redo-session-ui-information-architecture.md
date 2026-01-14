---
created: 2026-01-14T22:38
title: Redo Session UI with better information architecture
area: ui
files:
  - src/pages/Session.tsx
---

## Problem

Current Session page has wrong hierarchy - important things aren't prominent while minor things take up too much space.

In a bill-splitting context, the hierarchy should reflect what users need most:
1. **Primary:** Items to claim (the core action)
2. **Secondary:** Who's claiming what / participant status
3. **Tertiary:** Share code, receipt info, session metadata

Current layout may not reflect this priority, making it harder for users to focus on the main task.

## Solution

TBD - needs design review to determine:
- What's currently prominent vs what should be
- How to restructure the visual hierarchy
- Mobile-first layout that puts claiming front and center

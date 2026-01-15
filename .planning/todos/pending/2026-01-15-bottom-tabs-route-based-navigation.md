---
created: 2026-01-15T12:45
title: Bottom tabs with route-based navigation
area: ui
files: []
---

## Problem

Currently the bottom tab navigation is state-based rather than route-based. This means:
- Browser refresh loses the current tab state
- Back/forward browser buttons don't work with tabs
- URLs don't reflect which tab is active
- No deep linking to specific tabs

Users expect standard browser navigation to work with tabs.

## Solution

TBD — consider:
- Each tab gets its own route (e.g., `/bill/:code/items`, `/bill/:code/summary`)
- Use React Router nested routes for tab content
- Replace state-based tab switching with navigation
- Preserve any tab-specific state in URL or query params

---
created: 2026-01-14T12:15
title: Handle strange multi-frame scrolling issues
area: ui
files: []
---

## Problem

There are strange scrolling issues when multiple frames/views are involved in the app. This could manifest as:
- Scroll position not persisting correctly between views
- Nested scrollable containers fighting each other
- Mobile browser address bar interactions causing layout shifts
- Touch scroll getting "stuck" or jumping unexpectedly

The exact symptoms need investigation, but multi-frame/view scroll coordination is a known pain point in mobile web apps.

## Solution

TBD — needs investigation to identify specific symptoms and root cause. Potential areas to look at:
- CSS `overflow` properties on nested containers
- `position: fixed` vs `position: sticky` usage
- Mobile viewport meta tag and safe-area handling
- JavaScript scroll event handlers interfering
- React Router transitions affecting scroll restoration

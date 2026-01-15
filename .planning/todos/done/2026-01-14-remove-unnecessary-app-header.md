---
created: 2026-01-14T16:09
title: Remove unnecessary app header with "Split"
area: ui
files:
  - src/components/Layout.tsx:10
---

## Problem

The app has a persistent header with "Split" branding at the top that takes up vertical space on mobile. On a bill-splitting app used at restaurants, every pixel of screen real estate matters. The header is redundant since users already know what app they're using.

## Solution

Remove or minimize the header in Layout.tsx. Options:
- Remove entirely (most aggressive)
- Make it collapsible/hidden when scrolling
- Reduce height significantly

TBD: Decide if any branding should remain or if it's purely wasted space.

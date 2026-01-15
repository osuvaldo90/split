---
created: 2026-01-14T23:29
title: Flash item price or name on update
area: ui
files:
  - src/components/InlineItem.tsx
---

## Problem

When another participant edits an item's price or name, users need immediate visual feedback that a specific field changed. The general "animate item updates" todo covers overall item animation, but this is more specific: flash the actual field (price or name) that was modified so users can quickly see what changed.

This is especially important when multiple people are editing simultaneously — knowing which field changed helps users understand what happened.

## Solution

TBD — could be:
- Flash background of the specific input/text that changed
- Brief ring animation around the changed field
- Color pulse on the text itself
- Detect which field changed and only flash that one

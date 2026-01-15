---
created: 2026-01-14T16:05
title: Animate item updates with flash/fade
area: ui
files:
  - src/components/InlineItem.tsx
---

## Problem

When an item is updated (name or price changed by any participant), there's no visual indication that a change occurred. In a real-time collaborative app, users need feedback when data changes — especially if someone else edited an item they were looking at.

Without animation, changes feel abrupt and users might miss updates entirely if they're not watching that specific item.

## Solution

Add a flash/fade animation when item data changes:
- Brief highlight (e.g., background flash to accent color)
- Smooth fade back to normal
- Trigger on name or price change (detect via prop comparison or useEffect)
- Consider using Tailwind's animation utilities or CSS transitions
- Keep animation subtle — informative not distracting

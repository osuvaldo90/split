---
created: 2026-01-14T23:05
title: Bill ID tap opens native share sheet
area: ui
files: []
---

## Problem

Currently there's no easy way for the host to share the join link with other participants. Users need to manually copy the URL or tell others the session code.

Adding a tap interaction on the bill ID at the top of the screen that opens the native Web Share API sheet would make it trivial to:
- Send the join link via text message
- Share via messaging apps (WhatsApp, iMessage, etc.)
- Copy the link to clipboard
- Share via any installed sharing mechanism

## Solution

Use the Web Share API (`navigator.share()`) when clicking/tapping the bill ID header:

1. Make the bill ID area tappable (add cursor-pointer, hover state)
2. On tap, call `navigator.share({ title: 'Join my bill', url: joinUrl })`
3. Fallback to clipboard copy + toast for browsers without Web Share API support
4. Show visual feedback (share icon or hint text like "Tap to share")

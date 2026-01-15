---
created: 2026-01-14T23:08
title: First-time user getting started tutorial
area: ui
files: []
---

## Problem

New users opening the app for the first time have no guidance on how to use it. The app flow (create bill → scan receipt → share link → claim items → see totals) may not be immediately obvious, especially for:

- First-time hosts: How do I start? What's the bill ID for?
- Joining participants: What do I do after entering my name?
- General: What does claiming mean? How do splits work?

A quick onboarding tutorial would reduce friction and help users understand the app's value immediately.

## Solution

Consider:
- Tooltip/coach marks overlay on first visit (show "Tap here to scan receipt", etc.)
- Brief intro modal with 2-3 slides explaining the flow
- Inline hints that disappear after first interaction
- Store `hasSeenTutorial` in localStorage to show only once

Keep it minimal — the app should be intuitive enough that the tutorial is a gentle nudge, not required reading.

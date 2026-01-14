---
created: 2026-01-14T23:02
title: Persist participant session across visits
area: api
files:
  - src/pages/Join.tsx
  - convex/participants.ts
---

## Problem

When a user joins a session and then revisits the session URL later (e.g., refreshing browser, closing and reopening), they need to re-enter their name and rejoin. The app doesn't preserve that they were already a participant in that session.

This could be confusing - users might think they lost their claims or the session was reset.

## Solution

TBD - likely needs:
- LocalStorage or cookie to store participant ID after joining
- Check on session page load if stored participant ID matches a participant in current session
- If match found, automatically "reconnect" them without requiring name entry again
- Handle edge case: stored ID exists but participant was removed from session

May be addressed by Phase 4 (Real-Time Sync) infrastructure if it includes participant state management.

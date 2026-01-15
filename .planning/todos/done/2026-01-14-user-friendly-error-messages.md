---
created: 2026-01-14T15:00
title: User-friendly error messages
area: ui
files:
  - convex/sessions.ts
  - src/components/JoinSession.tsx
---

## Problem

Error messages from Convex mutations are not user-friendly. For example, when a user tries to join a session with a name that's already taken, they see a raw Convex error instead of a helpful message like "That name is already taken, please choose another."

Current errors are technical and confusing for end users.

## Solution

TBD - Parse Convex error responses and map to user-friendly messages in the UI layer, or update mutation error messages to be more descriptive.

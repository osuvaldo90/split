---
created: 2026-01-14T16:00
title: Allow host to remove users from session
area: api
files: []
---

## Problem

Currently there's no way for a session host to remove a user who has joined their session. This could be needed when:
- Someone joins the wrong session by accident
- A duplicate/test user needs to be cleaned up
- Host wants to manage who can claim items

## Solution

TBD - Likely involves:
- API endpoint for host to remove user (verify host permission)
- UI button in session management for host
- Handle claimed items when user is removed (unclaim? reassign?)

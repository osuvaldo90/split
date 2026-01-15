---
created: 2026-01-15T08:30
title: Add session history for previous bills
area: ui
files: []
---

## Problem

Users currently have no way to access their previous bill-splitting sessions. Once they close the browser or clear localStorage, they lose access to past sessions they participated in.

This matters because:
- Users may want to reference what they paid in a past dinner
- Settling up may happen days after the meal
- Users need confidence their data persists

## Solution

TBD - likely involves:
- Store participant history in localStorage (list of sessionId + participantId pairs)
- Home page section showing "Recent Sessions"
- Query to fetch session summary (restaurant name, date, total, your share)
- Consider data retention/cleanup policy for old sessions

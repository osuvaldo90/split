---
created: 2026-01-14T20:43
title: Rename concept of sessions to bills
area: general
files: []
---

## Problem

The codebase currently uses "session" terminology throughout (database tables, API functions, UI text, variable names). However, "bill" is more intuitive for end users:
- Users think "I'm splitting a bill" not "I'm creating a session"
- "Join this bill" is clearer than "Join this session"
- "Bill history" is more natural than "Session history"

This is a large refactoring task touching:
- Database schema (sessions table → bills table)
- Convex functions (session queries/mutations)
- React components and pages
- URL routes (/session/:id → /bill/:id)
- UI copy and labels

## Solution

TBD — this is a significant rename refactor:
1. Plan the migration carefully (may need database migration)
2. Update schema and backend first
3. Update frontend components
4. Update routes and URLs
5. Consider backwards compatibility for existing shared links

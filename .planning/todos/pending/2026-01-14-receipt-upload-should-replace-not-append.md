---
created: 2026-01-14T14:58
title: Receipt upload should replace items, not append
area: ui
files:
  - src/pages/Session.tsx
---

## Problem

When uploading a receipt after items already exist, the new receipt items are appended to existing items instead of replacing them. This creates duplicate/incorrect item lists.

Additionally, there's a "Replace Receipt" link in the UI that currently does nothing.

The expected behavior: uploading a new receipt should always replace all existing items with the new receipt's items.

## Solution

1. Fix the receipt upload handler to clear existing items before adding parsed receipt items
2. Wire up the "Replace Receipt" link to trigger the same replace behavior

---
created: 2026-01-14T00:00
title: Combine take photo and upload image buttons into one
area: ui
files:
  - src/components/ReceiptUpload.tsx
---

## Problem

Currently there are two separate buttons for capturing a receipt: one for taking a photo with the camera and one for uploading an existing image. This adds visual clutter and decision friction for users who just want to get their receipt into the app.

## Solution

TBD - Consider a single button that opens the native file picker with `capture="environment"` attribute, which on mobile devices offers both camera and gallery options in a single native UI.

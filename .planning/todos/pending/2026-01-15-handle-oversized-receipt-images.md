---
created: 2026-01-15T00:00
title: Handle oversized receipt images
area: api
files:
  - convex/actions/parseReceipt.ts:68-69
---

## Problem

Anthropic's Claude Vision API has a 5MB limit for base64-encoded images. When users upload large receipt photos (e.g., from phone cameras), the API returns:

```
400 {"type":"error","error":{"type":"invalid_request_error","message":"messages.0.content.0.image.source.base64: image exceeds 5 MB maximum: 7562460 bytes > 5242880 bytes"}}
```

Currently `parseReceipt.ts` converts the image to base64 and sends directly to the API without any size validation or compression.

## Solution

Options to evaluate:

1. **Server-side compression** (recommended): Use `sharp` library to resize/compress images over 5MB before sending to Claude. Receipts don't need high resolution for text extraction.

2. **Client-side resize**: Resize in browser before upload using canvas. Requires frontend changes.

3. **Reject with error**: Return helpful error asking user to upload smaller image. Simple but poor UX.

Leaning toward option 1 - transparent to users and handles the issue automatically.

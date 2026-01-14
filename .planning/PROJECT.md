# Split

## What This Is

A mobile-first web app for splitting restaurant bills in real-time. One person scans a receipt, gets a shareable code, and everyone at the table can join instantly to claim their items. No app download, no accounts — just open the link and start splitting.

## Core Value

Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Receipt capture via camera or file upload
- [ ] OCR processing to extract line items (name, price)
- [ ] Generate short alphanumeric code (6 chars) for session sharing
- [ ] Generate QR code linking directly to session
- [ ] Join session by entering code or scanning QR
- [ ] Enter display name when joining (no verification)
- [ ] Real-time sync across all participants on all screens
- [ ] View original receipt image (visible to all)
- [ ] Claim/unclaim items with instant updates
- [ ] Multiple people can claim same item (equal split)
- [ ] Anyone can edit line items to fix OCR errors
- [ ] Host sets tip: percentage on subtotal, percentage on subtotal+tax, or manual amount
- [ ] Tax distributed proportionally based on each person's share
- [ ] Summary screen showing everyone's totals
- [ ] Warning for unclaimed items (non-blocking)
- [ ] Session persists for days
- [ ] Support any group size (optimized for 2-15)
- [ ] Full visibility: everyone sees all claims by all participants

### Out of Scope

- Payment processing (Venmo, PayPal, Stripe) — just show who owes what
- User accounts and authentication — anonymous sessions only
- Offline functionality — requires internet throughout
- Session locking — stays editable until expiration
- Desktop-first design — mobile-first, responsive secondary

## Context

This is a personal tool for splitting bills with friends at restaurants. The primary use case is the common scenario where a group wants to split a bill by items rather than evenly. Currently this is done manually with calculators and confusion.

Key user journey:
1. Host scans receipt → sees parsed line items
2. Host shares code/QR with table
3. Everyone joins, enters name
4. All participants claim their items (can split shared items)
5. Host sets tip preferences
6. Everyone sees their total

Real-time sync is critical because people are sitting together, looking at phones, and expecting instant feedback when someone claims an item.

## Constraints

- **Cost**: Prefer free tiers; willing to pay for low-cost services if necessary (especially OCR)
- **Platform**: Pure web app — no native app downloads
- **Experience**: Mobile-first design for restaurant use
- **Development**: Test-driven development with red-green-refactor approach
- **Tech research**: Need to research optimal stack for real-time sync before implementation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Equal split only for shared items | Simplifies v1, avoids complex portion tracking | — Pending |
| Proportional tax distribution | Fairer than equal split when orders vary in size | — Pending |
| No user accounts | Reduces friction to zero — anyone can join instantly | — Pending |
| Days-long persistence | People may need to reference splits later | — Pending |
| Anyone can edit items | Faster OCR error correction without bottleneck | — Pending |
| Warning-only for unclaimed items | Flexible for edge cases, host can proceed | — Pending |

---
*Last updated: 2026-01-14 after initialization*

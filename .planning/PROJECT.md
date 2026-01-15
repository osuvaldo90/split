# Split

## What This Is

A mobile-first web app for splitting restaurant bills in real-time. One person scans a receipt, gets a shareable code, and everyone at the table can join instantly to claim their items. No app download, no accounts — just open the link and start splitting.

## Core Value

Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.

## Requirements

### Validated

- ✓ Receipt capture via camera or file upload — v1.0
- ✓ OCR processing to extract line items (name, price) — v1.0
- ✓ Generate short alphanumeric code (6 chars) for session sharing — v1.0
- ✓ Generate QR code linking directly to session — v1.0
- ✓ Join session by entering code or scanning QR — v1.0
- ✓ Enter display name when joining (no verification) — v1.0
- ✓ Real-time sync across all participants on all screens — v1.0
- ✓ View original receipt image (visible to all) — v1.0
- ✓ Claim/unclaim items with instant updates — v1.0
- ✓ Multiple people can claim same item (equal split) — v1.0
- ✓ Anyone can edit line items to fix OCR errors — v1.0
- ✓ Host sets tip: percentage on subtotal, percentage on subtotal+tax, or manual amount — v1.0
- ✓ Tax distributed proportionally based on each person's share — v1.0
- ✓ Summary screen showing everyone's totals — v1.0
- ✓ Warning for unclaimed items (non-blocking) — v1.0
- ✓ Session persists for days — v1.0
- ✓ Support any group size (optimized for 2-15) — v1.0
- ✓ Full visibility: everyone sees all claims by all participants — v1.0
- ✓ Auto-gratuity detection from receipts — v1.0
- ✓ Bill history on home screen — v1.0
- ✓ Security hardening (authorization, input validation) — v1.0
- ✓ Route protection with join prompt — direct `/bill/:id` requires joining before viewing — v1.1
- ✓ Participant authorization on mutations — verify caller is joined before allowing changes — v1.1
- ✓ Host-only enforcement on tax/tip mutations — v1.1

### Active

**Backlog:**
- [ ] Allow host to remove users from session
- [ ] Bill ID tap opens native share sheet
- [ ] Bottom tabs with route-based navigation
- [ ] First-time user getting started tutorial

### Out of Scope

- Payment processing (Venmo, PayPal, Stripe) — just show who owes what
- User accounts and authentication — anonymous sessions only
- Offline functionality — requires internet throughout
- Session locking — stays editable until expiration
- Desktop-first design — mobile-first, responsive secondary

## Context

Shipped v1.1 with 4,597 LOC TypeScript.
Tech stack: Vite + React, Convex (real-time backend), TailwindCSS v4, Claude Vision for OCR.
Built in 2 days (v1.0) + 1 day (v1.1) using GSD workflow methodology.

Key user journey:
1. Host scans receipt → sees parsed line items
2. Host shares code/QR with table
3. Everyone joins, enters name
4. All participants claim their items (can split shared items)
5. Host sets tip preferences
6. Everyone sees their total

Real-time sync is critical because people are sitting together, looking at phones, and expecting instant feedback when someone claims an item.

Security model: Session participants must join before viewing/mutating. Host-only restrictions on tax/tip settings. All mutations verify caller authorization.

## Constraints

- **Cost**: Prefer free tiers; willing to pay for low-cost services if necessary (especially OCR)
- **Platform**: Pure web app — no native app downloads
- **Experience**: Mobile-first design for restaurant use
- **Development**: Test-driven development with red-green-refactor approach
- **Tech research**: Need to research optimal stack for real-time sync before implementation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Equal split only for shared items | Simplifies v1, avoids complex portion tracking | ✓ Good |
| Proportional tax distribution | Fairer than equal split when orders vary in size | ✓ Good |
| No user accounts | Reduces friction to zero — anyone can join instantly | ✓ Good |
| Days-long persistence | People may need to reference splits later | ✓ Good |
| Anyone can edit items | Faster OCR error correction without bottleneck | ✓ Good |
| Warning-only for unclaimed items | Flexible for edge cases, host can proceed | ✓ Good |
| Claude Vision for OCR | Best balance of cost and accuracy vs Tesseract.js | ✓ Good |
| Convex for real-time | Zero-config WebSockets, built-in file storage | ✓ Good |
| TailwindCSS v4 | Vite plugin, native CSS custom properties | ✓ Good |
| localStorage trust model | Acceptable for low-stakes bill splitting use case | ✓ Good |
| Draft items in local state | Prevents empty items from broadcasting to others | ✓ Good |
| Prices stored in cents | Avoids floating point rounding issues | ✓ Good |
| JoinGate route protection | Non-participants see join prompt, not bill content | ✓ Good |
| Host-only auth pattern | fetch participant → check isHost → verify sessionId | ✓ Good |
| Participant verification on mutations | All write mutations verify caller is joined to session | ✓ Good |

---
*Last updated: 2026-01-15 after v1.1 milestone*

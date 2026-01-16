# Project Milestones: Split

## v1.2 Test Foundation (Shipped: 2026-01-15)

**Delivered:** Comprehensive test coverage with 140 tests (131 unit + 9 E2E) covering authorization, calculations, mutations, and browser flows.

**Phases completed:** 15-19 (6 plans total)

**Key accomplishments:**

- Test infrastructure with Vitest (edge-runtime) and Playwright (E2E)
- 30 authorization tests covering host-only mutations and access control
- 58 calculation tests for bill splitting, tax, and tip logic
- 39 mutation tests for session management and input validation
- 9 E2E tests covering host flow and guest join flow
- 100% coverage of all 31 v1.2 requirements

**Stats:**

- 40 files changed, 6,007 insertions
- 7,486 lines of TypeScript
- 5 phases, 6 plans, ~15 tasks
- 2 days (2026-01-14 → 2026-01-15)

**Git range:** `7ea7d16` → `2286e3e`

**What's next:** Pending todos include host user removal, native share sheet, bottom tabs navigation, and first-time tutorial.

---

## v1.1 Access Control (Shipped: 2026-01-15)

**Delivered:** Secured bill sessions with participant authorization and host-only restrictions for tax/tip settings.

**Phases completed:** 14 (4 plans total)

**Key accomplishments:**

- Route protection — Non-participants see join prompt at `/bill/:code` instead of bill content
- Participant authorization — All mutations verify caller is a joined session participant
- Host-only enforcement — Tax/tip mutations enforce host-only restriction with consistent pattern
- Security fix — Fixed cross-session vulnerability in unclaimByHost

**Stats:**

- 22 files changed, 1,587 insertions
- 4,597 lines of TypeScript (222 net new)
- 1 phase, 4 plans
- 1 day (2026-01-15)

**Git range:** `b994a3b` → `76c8fe7`

**What's next:** Pending todos include host user removal, native share sheet, bottom tabs navigation, and first-time tutorial.

---

## v1.0 MVP (Shipped: 2026-01-15)

**Delivered:** Complete mobile-first real-time bill splitting web app with receipt OCR, collaborative item claiming, and proportional tax/tip distribution.

**Phases completed:** 1-13 (34 plans total)

**Key accomplishments:**

- Receipt Processing — Camera/upload capture with Claude Vision OCR for line item extraction
- Real-Time Collaboration — WebSocket sync for instant updates across all participants
- Bill Splitting Engine — Proportional tax/tip distribution with split item support
- Session Management — QR codes, shareable 6-char codes, display name joining
- Security Hardening — Authorization on mutations, input validation, receipt URL verification
- Mobile-First UX — Responsive design, touch-friendly UI, connection status indicators

**Stats:**

- 193 files created/modified
- 4,375 lines of TypeScript
- 18 phases (including 5 inserted phases), 34 plans
- 2 days from init to ship (2026-01-14 → 2026-01-15)

**Git range:** `eac67c7` → `8d9b52f`

**What's next:** Pending todos include host user removal, native share sheet, bottom tabs navigation, and first-time tutorial.

---

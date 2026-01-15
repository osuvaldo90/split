# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-14)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.
**Current focus:** Phase 4 — Real-Time Sync

## Current Position

Phase: 4 of 8 (Real-Time Sync)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-01-15 — Completed 04-02-PLAN.md

Progress: █████████░ 58%

## Performance Metrics

**Velocity:**
- Total plans completed: 14
- Average duration: 3 min
- Total execution time: 0.8 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 17 min | 6 min |
| 02-receipt-processing | 3 | 8 min | 3 min |
| 02.1-receipt-fixes | 2 | 3 min | 1.5 min |
| 03-session-management | 3 | 3 min | 1 min |
| 03.1-inline-item-editing | 1 + FIX | 4 min | 2 min |
| 04-real-time-sync | 2 | 8 min | 4 min |

**Recent Trend:**
- Last 5 plans: 1 min, 1 min, 2 min, 3 min, 5 min
- Trend: fast

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01-01 | TailwindCSS v4 with Vite plugin | v4 uses Vite plugin instead of PostCSS config |
| 01-02 | max-w-md (448px) container width | Mobile-first design with clean desktop view |
| 01-02 | TailwindCSS @utility for safe-area | v4 syntax for custom utility classes |
| 01-03 | Prices in cents | Avoid floating point issues |
| 01-03 | Denormalized sessionId in claims | Efficient session-scoped queries |
| 01-03 | Separate claims table | Support multiple people claiming same item |
| 02-01 | Native file input for camera | Simpler than react-webcam for basic capture |
| 02-01 | Separate camera/upload buttons | Clear user intent for each action |
| 02-02 | claude-sonnet-4-5-20250514 for OCR | Best balance of cost and accuracy |
| 02-02 | Return parse errors with raw response | Allow UI to handle gracefully, aids debugging |
| 02.1-02 | Extra cent to first item for odd price division | Consistent rounding strategy for split items |
| 03-03 | Case-insensitive name comparison | Prevent "Alice" and "alice" as duplicates |
| 03.1-01 | Remove confirm step - items save directly to DB after OCR | Eliminates host bottleneck, enables collaborative editing |
| 03.1-01 | InlineItem uses mutations directly | No callback props, component calls mutations directly |
| 03.1-FIX | Detect new items by empty name for auto-edit | Simpler than prop drilling, no API changes |
| 04-01 | Store only participantId in localStorage | Minimal footprint, verify via query |
| 04-01 | Verify stored participant before redirect | Ensure data freshness and session match |
| 04-02 | Show join toasts only for post-mount participants | Use joinedAt timestamp vs mountTime comparison |
| 04-02 | Connection lost threshold: retries > 2 | Distinguish temporary reconnect from lost connection |

### Deferred Issues

2 todos deferred to later phases (in `.planning/todos/pending/`):
- **Detect auto-gratuity on receipts** (api) → Phase 6 (Calculation Engine)
- **Improve item count input UX** (ui) → Phase 8 (Polish)

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: Receipt Fixes (URGENT) — 3 bugs moved from deferred to fix now
- Phase 3.1 inserted after Phase 3: Inline Item Editing (URGENT) — remove confirm step, collaborative editing

### Pending Todos

11 todos in `.planning/todos/pending/`:
- **Allow host to remove users from session** (api)
- **Investigate concurrent add item race condition** (ui)
- **Animate item updates with flash/fade** (ui)
- **Fix inline item edit mode layout overflow** (ui)
- **User-friendly error messages** (ui)

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-15
Stopped at: Completed 04-02-PLAN.md
Resume file: None

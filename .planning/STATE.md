# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-14)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.
**Current focus:** Phase 5 — Item Management

## Current Position

Phase: 5 of 8 (Item Management)
Plan: FIX complete (2 + FIX in current phase)
Status: Phase complete, UAT fixes applied
Last activity: 2026-01-15 — Completed 05-FIX-PLAN.md

Progress: ██████████ 70%

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: 3 min
- Total execution time: 0.85 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 17 min | 6 min |
| 02-receipt-processing | 3 | 8 min | 3 min |
| 02.1-receipt-fixes | 2 | 3 min | 1.5 min |
| 03-session-management | 3 | 3 min | 1 min |
| 03.1-inline-item-editing | 1 + FIX | 4 min | 2 min |
| 04-real-time-sync | 3 | 10 min | 3 min |
| 05-item-management | 2 + FIX | 8 min | 2.7 min |

**Recent Trend:**
- Last 5 plans: 2 min, 3 min, 5 min, 4 min, 2 min
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
| 05-01 | Blue border for claimed items, faded for unclaimed | Visual distinction for claim status |
| 05-01 | stopPropagation on edit button | Prevent edit tap from triggering claim toggle |
| 05-02 | Blue left border accent for my claims | Visual hierarchy for claim ownership |
| 05-02 | Host x buttons on claimer pills | Allow host to fix claim mistakes |
| 05-FIX | Return hostParticipantId from create mutation | Enables host claiming without separate query |

### Deferred Issues

2 todos deferred to later phases (in `.planning/todos/pending/`):
- **Detect auto-gratuity on receipts** (api) → Phase 6 (Calculation Engine)
- **Improve item count input UX** (ui) → Phase 8 (Polish)

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: Receipt Fixes (URGENT) — 3 bugs moved from deferred to fix now
- Phase 3.1 inserted after Phase 3: Inline Item Editing (URGENT) — remove confirm step, collaborative editing
- Phase 5.1 inserted after Phase 5: Fix New Item Broadcast (URGENT) — hide new items from others until saved

### Pending Todos

12 todos in `.planning/todos/pending/`:
- **Add session history for previous bills** (ui)
- **Allow host to remove users from session** (api)
- **Animate item updates with flash/fade** (ui)
- **Fix inline item edit mode layout overflow** (ui)
- **User-friendly error messages** (ui)

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-15
Stopped at: Completed 05-FIX-PLAN.md (UAT fixes applied)
Resume file: None

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-14)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.
**Current focus:** Phase 4 — Real-Time Sync

## Current Position

Phase: 3 of 8 (Session Management) — Complete
Plan: 3 of 3 in current phase
Status: Phase complete
Last activity: 2026-01-14 — Completed 03-03-PLAN.md

Progress: █████████░ 45%

## Performance Metrics

**Velocity:**
- Total plans completed: 8
- Average duration: 4 min
- Total execution time: 0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 17 min | 6 min |
| 02-receipt-processing | 3 | 8 min | 3 min |
| 02.1-receipt-fixes | 2 | 3 min | 1.5 min |

**Recent Trend:**
- Last 5 plans: 3 min, 3 min, 1 min, 1 min, 1 min
- Trend: stable

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

### Deferred Issues

2 todos deferred to later phases (in `.planning/todos/pending/`):
- **Detect auto-gratuity on receipts** (api) → Phase 6 (Calculation Engine)
- **Improve item count input UX** (ui) → Phase 8 (Polish)

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: Receipt Fixes (URGENT) — 3 bugs moved from deferred to fix now

### Pending Todos

Phase 2.1 complete. All todos resolved:
- Receipt upload should replace items, not append (02.1-01)
- Split quantity items into separate lines (02.1-02)
- Format money inputs consistently (02.1-01)

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-14T22:24:02Z
Stopped at: Completed 03-02-PLAN.md (Share code display)
Resume file: None

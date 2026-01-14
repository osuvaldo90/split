# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-14)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.
**Current focus:** Phase 2 — Receipt Processing

## Current Position

Phase: 2 of 8 (Receipt Processing)
Plan: 2 of 3 in current phase
Status: In progress
Last activity: 2026-01-14 — Completed 02-02-PLAN.md

Progress: █████░░░░░ 21%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 5 min
- Total execution time: 0.37 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3 | 17 min | 6 min |
| 02-receipt-processing | 2 | 5 min | 3 min |

**Recent Trend:**
- Last 5 plans: 15 min, 2 min, 2 min, 3 min
- Trend: improving

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

### Deferred Issues

4 todos deferred to later phase (in `.planning/todos/pending/`):
- **Detect auto-gratuity on receipts** (api) — OCR should detect pre-added tips/service charges
- **Split quantity items into separate lines** (api) — "2 Pilsner $13" → 2x "Pilsner" at $6.50
- **Format money inputs consistently** (ui) — "$4.80" showing as "4.8"
- **Improve item count input UX** (ui) — count input disappears at 1

### Pending Todos

None — all deferred.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-14
Stopped at: Completed 02-02-PLAN.md
Resume file: None

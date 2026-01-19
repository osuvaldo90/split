# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-16)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser
**Current focus:** v1.3 milestone complete

## Current Position

Phase: 22 of 22 (Handwritten Tip Detection)
Plan: 1 of 1 in current phase
Status: Milestone complete
Last activity: 2026-01-19 — Completed v1.3 milestone

Progress: ████████████████████████ 100% (22/22 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 37+
- Average duration: ~15 min
- Total execution time: ~9.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| v1.0-v1.2 | 35+ | ~9h | ~15 min |
| v1.3 (20-21) | 4 | ~13 min | ~3 min |

**Recent Trend:**
- Last milestone: v1.2 Test Foundation (4 phases, 2 days)
- Trend: Stable

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.0: Claude Vision for OCR (best cost/accuracy balance)
- v1.2: edge-runtime for Vitest (match Convex production)
- v1.3: Structured outputs beta for guaranteed JSON (20-01)
- v1.3: 0.7 confidence threshold for receipt validation (20-01)
- v1.3: Dual-read fallback for fees table migration (21-01)
- v1.3: Extract gratuity in both fees array AND gratuity field (21-02)
- v1.3: 0.8 confidence threshold for handwritten tip pre-fill (22-01)

### Pending Todos

5 todos in `.planning/todos/pending/`:
- Allow host to remove users from session (api)
- Bill ID tap opens native share sheet (ui)
- Bottom tabs with route-based navigation (ui)
- First-time user getting started tutorial (ui)
- Handle oversized receipt images (api)

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-01-19
Stopped at: Completed 22-01-PLAN.md (Phase 22 complete)
Resume file: None

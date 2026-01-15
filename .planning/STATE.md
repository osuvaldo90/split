# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-15)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.
**Current focus:** v1.2 Test Foundation

## Current Position

Phase: 17 of 19 (Calculation Tests)
Plan: Not started
Status: Ready to plan
Last activity: 2026-01-15 — Phase 16 (Authorization Tests) complete

Progress: ████░░░░░░ 40% (2/5 phases)

## Milestone Summary

**v1.2 Test Foundation — IN PROGRESS**

Target features:
- Backend unit tests for authorization, calculations, mutations
- E2E tests for host flow, join flow, real-time sync

Previous: v1.1 Access Control shipped 2026-01-15

See: [.planning/MILESTONES.md](.planning/MILESTONES.md)

## Accumulated Decisions

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 15-01 | edge-runtime environment for Vitest | Required for Convex function testing to match production runtime |
| 15-01 | webServer reuseExistingServer | Allows faster iteration when dev server already running |
| 16-01 | environmentMatchGlobs for convex tests | convex-test requires node environment while calculations use edge-runtime |
| 16-01 | server.deps.inline for convex-test | Required for import.meta.glob transformation in vitest |

## Pending Todos

5 todos in `.planning/todos/pending/`:
- **Allow host to remove users from session** (api)
- **Bill ID tap opens native share sheet** (ui)
- **Bottom tabs with route-based navigation** (ui)
- **First-time user getting started tutorial** (ui)
- **Handle oversized receipt images** (api)

## Session Continuity

Last session: 2026-01-15
Stopped at: Phase 16 complete, ready for Phase 17
Resume file: None

## Documentation

- `README.md` - Quick start guide for local development
- `docs/architecture.md` - Key patterns and design decisions

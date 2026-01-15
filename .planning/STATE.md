# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-15)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.
**Current focus:** v1.2 Test Foundation

## Current Position

Phase: 15 of 19 (Test Infrastructure)
Plan: 1 of 1 complete
Status: Phase complete
Last activity: 2026-01-15 — Completed 15-01-PLAN.md

Progress: ██░░░░░░░░ 20% (1/5 phases)

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

## Pending Todos

5 todos in `.planning/todos/pending/`:
- **Allow host to remove users from session** (api)
- **Bill ID tap opens native share sheet** (ui)
- **Bottom tabs with route-based navigation** (ui)
- **First-time user getting started tutorial** (ui)
- **Handle oversized receipt images** (api)

## Session Continuity

Last session: 2026-01-15
Stopped at: Completed 15-01-PLAN.md
Resume file: None

## Documentation

- `README.md` - Quick start guide for local development
- `docs/architecture.md` - Key patterns and design decisions

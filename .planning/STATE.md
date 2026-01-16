# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-15)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.
**Current focus:** v1.2 Test Foundation

## Current Position

Phase: 19 of 19 (E2E Tests)
Plan: 02 of 02 complete
Status: Phase complete — Milestone complete
Last activity: 2026-01-16 — Completed Phase 19 (E2E Tests), v1.2 milestone complete

Progress: ██████████ 100% (5/5 phases)

## Milestone Summary

**v1.2 Test Foundation — COMPLETE**

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
| 17-01 | Pure function tests in edge-runtime | No convex-test needed for calculations.ts functions |
| 18-01 | Test through mutations not direct validation | Ensures end-to-end validation works correctly |
| 19-01 | Use .first() for price selectors in E2E tests | Prices appear in multiple places (item row and totals) |
| 19-01 | Self-contained E2E tests create own sessions | Ensures test isolation and reliability |
| 19-02 | browser.newContext() for multi-user isolation | Separate localStorage/cookies for host vs guest sessions |
| 19-02 | Filter by "Tap to claim" text for item state | Reliable detection of claimable item state before interaction |

## Pending Todos

5 todos in `.planning/todos/pending/`:
- **Allow host to remove users from session** (api)
- **Bill ID tap opens native share sheet** (ui)
- **Bottom tabs with route-based navigation** (ui)
- **First-time user getting started tutorial** (ui)
- **Handle oversized receipt images** (api)

## Session Continuity

Last session: 2026-01-16T00:15:00Z
Stopped at: Completed Phase 19, v1.2 milestone complete
Resume file: None

## Documentation

- `README.md` - Quick start guide for local development
- `docs/architecture.md` - Key patterns and design decisions

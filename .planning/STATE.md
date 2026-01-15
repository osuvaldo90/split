# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-15)

**Core value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.
**Current focus:** v1.1 Access Control

## Current Position

Phase: 14 of 14 (Access Control)
Plan: 4 of 4 complete
Status: In progress
Last activity: 2026-01-15 - Completed 14-04-PLAN.md (host-only audit)

Progress: █████████████████████ 100% (4/4 plans)

## Milestone Summary

**v1.1 Access Control — In Progress**

Target features:
- Route protection with join prompt
- Participant authorization on mutations
- Host-only checks audit

Previous: v1.0 MVP shipped 2026-01-15

See: [.planning/MILESTONES.md](.planning/MILESTONES.md)

## Accumulated Decisions

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Host-only pattern: fetch participant, check isHost, verify sessionId | 14-04 | Consistent authorization across all host mutations |
| Fixed unclaimByHost cross-session vulnerability | 14-04 | Security fix - hosts should only operate in their own session |

## Pending Todos

5 todos in `.planning/todos/pending/`:
- **Allow host to remove users from session** (api)
- **Bill ID tap opens native share sheet** (ui)
- **Bottom tabs with route-based navigation** (ui)
- **First-time user getting started tutorial** (ui)
- **Handle oversized receipt images** (api)

## Session Continuity

Last session: 2026-01-15
Stopped at: Completed 14-04-PLAN.md (host-only audit)
Resume file: None

## Documentation

- `README.md` - Quick start guide for local development
- `docs/architecture.md` - Key patterns and design decisions

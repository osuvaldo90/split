# Roadmap: Split

## Overview

Build a mobile-first real-time bill splitting web app from foundation through polish. Start with project setup, integrate OCR for receipt capture, establish real-time sync infrastructure, implement collaborative item claiming, build calculation logic for tax/tip distribution, and refine the mobile UX for seamless restaurant use.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-13 (shipped 2026-01-15)
- 🚧 **v1.1 Access Control** — Phase 14 (in progress)

## Completed Milestones

- ✅ [v1.0 MVP](milestones/v1.0-ROADMAP.md) (Phases 1-13) — SHIPPED 2026-01-15

<details>
<summary>✅ v1.0 MVP (Phases 1-13) — SHIPPED 2026-01-15</summary>

- [x] Phase 1: Foundation (3/3 plans) — completed 2026-01-14
- [x] Phase 2: Receipt Processing (3/3 plans) — completed 2026-01-14
- [x] Phase 2.1: Receipt Fixes (2/2 plans) — completed 2026-01-14
- [x] Phase 3: Session Management (3/3 plans) — completed 2026-01-14
- [x] Phase 3.1: Inline Item Editing (1/1 plans) — completed 2026-01-14
- [x] Phase 4: Real-Time Sync (3/3 plans) — completed 2026-01-14
- [x] Phase 5: Item Management (2/2 plans) — completed 2026-01-15
- [x] Phase 5.1: Fix New Item Broadcast (1/1 plans) — completed 2026-01-15
- [x] Phase 6: Calculation Engine (3/3 plans) — completed 2026-01-14
- [x] Phase 7: Summary & Display (1/1 plans) — completed 2026-01-15
- [x] Phase 8: Polish & Optimization (3/3 plans) — completed 2026-01-15
- [x] Phase 9: UI/UX Improvements (1/1 plans) — completed 2026-01-15
- [x] Phase 10: Feature Enhancements (3/3 plans) — completed 2026-01-15
- [x] Phase 10.1: Bug Fixes and UX (2/2 plans) — completed 2026-01-15
- [x] Phase 10.2: Join Bill UI Simplification (1/1 plans) — completed 2026-01-15
- [x] Phase 11: Security Review (1/1 plans) — completed 2026-01-15
- [x] Phase 12: Security Hardening (4/4 plans) — completed 2026-01-15
- [x] Phase 13: Documentation (1/1 plans) — completed 2026-01-15

</details>

## Progress

| Phase                            | Milestone | Plans Complete | Status   | Completed  |
| -------------------------------- | --------- | -------------- | -------- | ---------- |
| 1. Foundation                    | v1.0      | 3/3            | Complete | 2026-01-14 |
| 2. Receipt Processing            | v1.0      | 3/3            | Complete | 2026-01-14 |
| 2.1 Receipt Fixes                | v1.0      | 2/2            | Complete | 2026-01-14 |
| 3. Session Management            | v1.0      | 3/3            | Complete | 2026-01-14 |
| 3.1 Inline Item Editing          | v1.0      | 1/1            | Complete | 2026-01-14 |
| 4. Real-Time Sync                | v1.0      | 3/3            | Complete | 2026-01-14 |
| 5. Item Management               | v1.0      | 2/2            | Complete | 2026-01-15 |
| 5.1 Fix New Item Broadcast       | v1.0      | 1/1            | Complete | 2026-01-15 |
| 6. Calculation Engine            | v1.0      | 3/3            | Complete | 2026-01-14 |
| 7. Summary & Display             | v1.0      | 1/1            | Complete | 2026-01-15 |
| 8. Polish & Optimization         | v1.0      | 3/3            | Complete | 2026-01-15 |
| 9. UI/UX Improvements            | v1.0      | 1/1            | Complete | 2026-01-15 |
| 10. Feature Enhancements         | v1.0      | 3/3            | Complete | 2026-01-15 |
| 10.1 Bug Fixes and UX            | v1.0      | 2/2            | Complete | 2026-01-15 |
| 10.2 Join Bill UI Simplification | v1.0      | 1/1            | Complete | 2026-01-15 |
| 11. Security Review              | v1.0      | 1/1            | Complete | 2026-01-15 |
| 12. Security Hardening           | v1.0      | 4/4            | Complete | 2026-01-15 |
| 13. Documentation                | v1.0      | 1/1            | Complete | 2026-01-15 |

### 🚧 v1.1 Access Control (In Progress)

**Milestone Goal:** Secure bill sessions so only joined participants can view and mutate, with verified host-only restrictions for tax/tip.

#### Phase 14: Access Control
**Goal**: Secure bill sessions with proper authorization
**Depends on**: Phase 13 (builds on security hardening)
**Requirements**: ACCESS-01, ACCESS-02, ACCESS-03
**Success Criteria** (what must be TRUE):
  1. User cannot view bill content at `/bill/:id` without first joining the session
  2. All item/claim mutations fail for non-participants
  3. Tax and tip mutations fail for non-hosts
  4. Existing participants retain full functionality
**Research**: Unlikely (internal Convex patterns, extends existing auth code)
**Plans**: 4

Plans:
- [ ] 14-01: Route protection with JoinGate component
- [ ] 14-02: Mutation authorization (participantId verification)
- [ ] 14-03: Frontend mutation call updates
- [ ] 14-04: Host-only authorization audit

## v1.1 Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 14. Access Control | v1.1 | 0/4 | Planned | - |

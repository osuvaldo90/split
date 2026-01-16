# Requirements: Split Test Foundation

**Defined:** 2026-01-15
**Core Value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.

## v1.2 Requirements

Requirements for test foundation. Each maps to roadmap phases.

### Backend Testing

- [x] **BTEST-01**: Authorization unit tests verify non-participants cannot add items
- [x] **BTEST-02**: Authorization unit tests verify non-participants cannot claim items
- [x] **BTEST-03**: Authorization unit tests verify non-hosts cannot update tip settings
- [x] **BTEST-04**: Authorization unit tests verify non-hosts cannot update tax settings
- [x] **BTEST-05**: Authorization unit tests verify non-hosts cannot remove items
- [x] **BTEST-06**: Authorization unit tests verify non-hosts cannot use addBulk
- [x] **BTEST-07**: Authorization unit tests verify hosts can perform host-only actions
- [x] **BTEST-08**: Authorization unit tests verify participants can claim/unclaim own items
- [x] **BTEST-09**: Authorization unit tests verify cross-session access is denied
- [x] **BTEST-10**: Calculation unit tests verify even split distribution with remainder
- [x] **BTEST-11**: Calculation unit tests verify tax distribution proportional to subtotal
- [x] **BTEST-12**: Calculation unit tests verify tip calculation (percent on subtotal)
- [x] **BTEST-13**: Calculation unit tests verify tip calculation (percent on total)
- [x] **BTEST-14**: Calculation unit tests verify manual tip distribution
- [x] **BTEST-15**: Calculation unit tests verify edge cases (zero claimants, single claimant)
- [x] **BTEST-16**: Core mutation tests verify session creation generates valid code
- [x] **BTEST-17**: Core mutation tests verify joining creates participant correctly
- [x] **BTEST-18**: Core mutation tests verify duplicate name rejection
- [x] **BTEST-19**: Core mutation tests verify claim idempotency
- [x] **BTEST-20**: Core mutation tests verify item removal cascades claims
- [x] **BTEST-21**: Input validation tests verify name validation
- [x] **BTEST-22**: Input validation tests verify money validation
- [x] **BTEST-23**: Input validation tests verify tip percent validation

### E2E Testing

- [x] **E2E-01**: Host can create bill and enter display name
- [x] **E2E-02**: Host can add items with name and price
- [x] **E2E-03**: Host can set tip settings
- [x] **E2E-04**: Host can view summary with totals
- [x] **E2E-05**: Guest can join via session code
- [x] **E2E-06**: Guest can enter display name
- [x] **E2E-07**: Guest can claim items
- [x] **E2E-08**: Guest can see updated totals after claiming

## v1.2.x Requirements (Stretch)

Attempt if feasible; defer if complexity is too high.

### Real-time Sync

- **SYNC-01**: Multi-context test verifies host item addition appears for guest instantly
- **SYNC-02**: Multi-context test verifies guest claim appears for host instantly
- **SYNC-03**: Multi-context test verifies tip update propagates to all participants

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Error Handling

- **ERR-01**: Test invalid session code returns appropriate error
- **ERR-02**: Test network failure handling
- **ERR-03**: Test duplicate name in same session returns error

### Extended Testing

- **EXT-01**: Visual regression tests for summary screen
- **EXT-02**: Load testing for concurrent WebSocket connections
- **EXT-03**: Cross-browser testing (Safari, Firefox)
- **EXT-04**: Mobile viewport E2E tests
- **EXT-05**: Accessibility testing (axe-core)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mutation testing (Stryker) | High complexity, defer until test suite matures |
| 100% code coverage target | Diminishing returns; focus on critical paths (70-80% target) |
| Testing every UI component | Brittle to UI changes, high maintenance |
| Full WebSocket load testing | Premature optimization; app not at scale yet |
| Cross-browser testing now | Safari/Firefox can wait until v2 |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| BTEST-01 | Phase 16 | Complete |
| BTEST-02 | Phase 16 | Complete |
| BTEST-03 | Phase 16 | Complete |
| BTEST-04 | Phase 16 | Complete |
| BTEST-05 | Phase 16 | Complete |
| BTEST-06 | Phase 16 | Complete |
| BTEST-07 | Phase 16 | Complete |
| BTEST-08 | Phase 16 | Complete |
| BTEST-09 | Phase 16 | Complete |
| BTEST-10 | Phase 17 | Complete |
| BTEST-11 | Phase 17 | Complete |
| BTEST-12 | Phase 17 | Complete |
| BTEST-13 | Phase 17 | Complete |
| BTEST-14 | Phase 17 | Complete |
| BTEST-15 | Phase 17 | Complete |
| BTEST-16 | Phase 18 | Complete |
| BTEST-17 | Phase 18 | Complete |
| BTEST-18 | Phase 18 | Complete |
| BTEST-19 | Phase 18 | Complete |
| BTEST-20 | Phase 18 | Complete |
| BTEST-21 | Phase 18 | Complete |
| BTEST-22 | Phase 18 | Complete |
| BTEST-23 | Phase 18 | Complete |
| E2E-01 | Phase 19 | Complete |
| E2E-02 | Phase 19 | Complete |
| E2E-03 | Phase 19 | Complete |
| E2E-04 | Phase 19 | Complete |
| E2E-05 | Phase 19 | Complete |
| E2E-06 | Phase 19 | Complete |
| E2E-07 | Phase 19 | Complete |
| E2E-08 | Phase 19 | Complete |

**Coverage:**
- v1.2 requirements: 31 total
- Mapped to phases: 31 ✓
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-15*
*Last updated: 2026-01-15 after Phase 19 completion — v1.2 milestone complete*

# Requirements: Split Test Foundation

**Defined:** 2026-01-15
**Core Value:** Seamless, real-time collaborative bill splitting that works instantly for anyone with a phone and a browser.

## v1.2 Requirements

Requirements for test foundation. Each maps to roadmap phases.

### Backend Testing

- [ ] **BTEST-01**: Authorization unit tests verify non-participants cannot add items
- [ ] **BTEST-02**: Authorization unit tests verify non-participants cannot claim items
- [ ] **BTEST-03**: Authorization unit tests verify non-hosts cannot update tip settings
- [ ] **BTEST-04**: Authorization unit tests verify non-hosts cannot update tax settings
- [ ] **BTEST-05**: Authorization unit tests verify non-hosts cannot remove items
- [ ] **BTEST-06**: Authorization unit tests verify non-hosts cannot use addBulk
- [ ] **BTEST-07**: Authorization unit tests verify hosts can perform host-only actions
- [ ] **BTEST-08**: Authorization unit tests verify participants can claim/unclaim own items
- [ ] **BTEST-09**: Authorization unit tests verify cross-session access is denied
- [ ] **BTEST-10**: Calculation unit tests verify even split distribution with remainder
- [ ] **BTEST-11**: Calculation unit tests verify tax distribution proportional to subtotal
- [ ] **BTEST-12**: Calculation unit tests verify tip calculation (percent on subtotal)
- [ ] **BTEST-13**: Calculation unit tests verify tip calculation (percent on total)
- [ ] **BTEST-14**: Calculation unit tests verify manual tip distribution
- [ ] **BTEST-15**: Calculation unit tests verify edge cases (zero claimants, single claimant)
- [ ] **BTEST-16**: Core mutation tests verify session creation generates valid code
- [ ] **BTEST-17**: Core mutation tests verify joining creates participant correctly
- [ ] **BTEST-18**: Core mutation tests verify duplicate name rejection
- [ ] **BTEST-19**: Core mutation tests verify claim idempotency
- [ ] **BTEST-20**: Core mutation tests verify item removal cascades claims
- [ ] **BTEST-21**: Input validation tests verify name validation
- [ ] **BTEST-22**: Input validation tests verify money validation
- [ ] **BTEST-23**: Input validation tests verify tip percent validation

### E2E Testing

- [ ] **E2E-01**: Host can create bill and enter display name
- [ ] **E2E-02**: Host can add items with name and price
- [ ] **E2E-03**: Host can set tip settings
- [ ] **E2E-04**: Host can view summary with totals
- [ ] **E2E-05**: Guest can join via session code
- [ ] **E2E-06**: Guest can enter display name
- [ ] **E2E-07**: Guest can claim items
- [ ] **E2E-08**: Guest can see updated totals after claiming

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
| BTEST-01 | TBD | Pending |
| BTEST-02 | TBD | Pending |
| BTEST-03 | TBD | Pending |
| BTEST-04 | TBD | Pending |
| BTEST-05 | TBD | Pending |
| BTEST-06 | TBD | Pending |
| BTEST-07 | TBD | Pending |
| BTEST-08 | TBD | Pending |
| BTEST-09 | TBD | Pending |
| BTEST-10 | TBD | Pending |
| BTEST-11 | TBD | Pending |
| BTEST-12 | TBD | Pending |
| BTEST-13 | TBD | Pending |
| BTEST-14 | TBD | Pending |
| BTEST-15 | TBD | Pending |
| BTEST-16 | TBD | Pending |
| BTEST-17 | TBD | Pending |
| BTEST-18 | TBD | Pending |
| BTEST-19 | TBD | Pending |
| BTEST-20 | TBD | Pending |
| BTEST-21 | TBD | Pending |
| BTEST-22 | TBD | Pending |
| BTEST-23 | TBD | Pending |
| E2E-01 | TBD | Pending |
| E2E-02 | TBD | Pending |
| E2E-03 | TBD | Pending |
| E2E-04 | TBD | Pending |
| E2E-05 | TBD | Pending |
| E2E-06 | TBD | Pending |
| E2E-07 | TBD | Pending |
| E2E-08 | TBD | Pending |

**Coverage:**
- v1.2 requirements: 31 total
- Mapped to phases: 0 (pending create-roadmap)
- Unmapped: 31 ⚠️

---
*Requirements defined: 2026-01-15*
*Last updated: 2026-01-15 after initial definition*

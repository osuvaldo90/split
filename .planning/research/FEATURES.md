# Test Foundation Research

**Domain:** Real-time collaborative web app testing (bill splitting)
**Researched:** 2026-01-15
**Confidence:** MEDIUM (blend of official docs and industry patterns)

## Feature Landscape

### Table Stakes (Users Expect These)

Test coverage users (developers) assume exists. Missing these = regressions go unnoticed.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Authorization unit tests | Security-critical code must be verified | MEDIUM | Test all mutations verify caller is participant; host-only restrictions on tax/tip/remove |
| Calculation unit tests | Financial accuracy is non-negotiable | LOW | Pure functions are easy to test; edge cases for rounding, zero values, proportional distribution |
| Core mutation tests | Business logic correctness | MEDIUM | Create session, join, add items, claim/unclaim, update tip/tax |
| Input validation tests | Prevent malicious or malformed data | LOW | validateName, validateMoney, validateTipPercent, validateItemName |
| Error handling tests | Graceful failures for edge cases | LOW | Non-existent sessions, duplicate names, unauthorized access |

### Differentiators (Competitive Advantage)

Testing features that set apart a production-ready app from an MVP.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| E2E multi-user flow tests | Catch integration bugs across host/guest flows | HIGH | Requires Playwright with multiple browser contexts |
| Real-time sync verification | Ensure instant propagation | HIGH | Multiple clients must see same state after mutation |
| Visual regression tests | Catch UI regressions | MEDIUM | Screenshot comparison for critical flows |
| Load/stress tests | Validate scalability | HIGH | Artillery for WebSocket load testing; defer to v1.3+ |
| Mutation testing | Validate test quality | MEDIUM | Stryker to verify tests actually catch bugs; defer initially |

### Anti-Features (Commonly Requested, Often Problematic)

Testing approaches that seem good but create maintenance burden.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| 100% code coverage | Feels complete | Time-consuming for diminishing returns; leads to testing implementation details | Target 70-80% for critical paths (auth, calculations) |
| Testing every UI component | Comprehensive coverage | Brittle to UI changes; high maintenance | Focus E2E on critical flows; unit test pure logic |
| Mocking everything | Fast tests | Tests don't reflect real behavior | Use convex-test for backend; mock only external services |
| Testing real-time with timers | Simulates delays | Flaky tests; slow CI | Use Convex's reactive subscription model |
| Full WebSocket load testing now | Future-proofing | Premature optimization; app not at scale yet | Defer until actual usage patterns emerge |

## Feature Dependencies

```
[Calculation Unit Tests]
    (standalone - no dependencies)

[Input Validation Tests]
    (standalone - no dependencies)

[Authorization Unit Tests]
    └──requires──> [Test infrastructure setup (convex-test, vitest)]

[Core Mutation Tests]
    └──requires──> [Authorization tests pass]
                       └──requires──> [Test infrastructure]

[E2E Host Flow]
    └──requires──> [Backend unit tests pass]
                       └──requires──> [Playwright setup]

[E2E Join Flow]
    └──requires──> [E2E Host Flow]
                       └──enhances──> [Real-time sync tests]

[Real-time Sync Tests]
    └──requires──> [E2E Host Flow + Join Flow]
                       └──requires──> [Multiple browser contexts]
```

### Dependency Notes

- **Authorization tests require test infrastructure:** convex-test and vitest must be configured before testing Convex functions
- **Mutation tests depend on auth tests:** Verify security model first, then test business logic
- **E2E tests depend on backend tests:** Unit test backend before integration testing
- **Real-time sync requires multi-context:** Playwright's BrowserContext enables parallel browser sessions
- **Load testing conflicts with v1.2 scope:** Defer to v1.3+ when actual scale is known

## MVP Definition

### Launch With (v1.2)

Minimum test foundation to prevent regressions.

- [x] Test infrastructure — Vitest + convex-test configured
- [ ] Calculation unit tests — calculateItemShare, distributeWithRemainder, calculateTipShare (pure functions)
- [ ] Authorization unit tests — Host-only mutations reject non-hosts; participant mutations reject non-participants
- [ ] Core mutation tests — Create session, join, add item, claim, update tip/tax
- [ ] E2E host flow — Create bill, upload receipt, add items, set tip, view totals
- [ ] E2E join flow — Enter code, join session, claim items, see updated totals

### Add After Validation (v1.2.x)

Features to add once core test suite is working.

- [ ] Real-time sync E2E — Host adds item, guest sees it instantly (multi-context test)
- [ ] Error boundary tests — Invalid session codes, network failures, duplicate names
- [ ] Visual regression — Screenshot key screens (summary, item list)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Load testing — Artillery WebSocket tests for concurrent users
- [ ] Mutation testing — Stryker to verify test quality
- [ ] Cross-browser testing — Safari, Firefox via Playwright
- [ ] Mobile viewport E2E — Test touch interactions
- [ ] Accessibility testing — axe-core integration

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Calculation unit tests | HIGH | LOW | P1 |
| Authorization unit tests | HIGH | MEDIUM | P1 |
| Core mutation tests | HIGH | MEDIUM | P1 |
| E2E host flow | HIGH | MEDIUM | P1 |
| E2E join flow | HIGH | MEDIUM | P1 |
| Input validation tests | MEDIUM | LOW | P1 |
| Real-time sync E2E | HIGH | HIGH | P2 |
| Error handling tests | MEDIUM | LOW | P2 |
| Visual regression | LOW | MEDIUM | P3 |
| Load testing | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.2 launch
- P2: Should have, add in v1.2.x
- P3: Nice to have, future consideration

## Test Scenarios by Category

### Authorization Tests (Table Stakes)

**Must test (OWASP Top 10 A01 - Broken Access Control):**

| Scenario | Expected Behavior | Confidence |
|----------|-------------------|------------|
| Non-participant tries to add item | Throws "Not authorized" error | HIGH |
| Non-participant tries to claim item | Throws "Not authorized" error | HIGH |
| Non-host tries to update tip | Throws "Only host can modify" error | HIGH |
| Non-host tries to update tax | Throws "Only host can modify" error | HIGH |
| Non-host tries to remove item | Throws "Only host can remove" error | HIGH |
| Non-host tries to addBulk | Throws "Only host can replace" error | HIGH |
| Participant from Session A tries to mutate Session B | Throws authorization error | HIGH |
| Host can update tip settings | Succeeds | HIGH |
| Host can update tax settings | Succeeds | HIGH |
| Host can remove items | Succeeds | HIGH |
| Participant can unclaim their own claim | Succeeds | HIGH |
| Host can unclaim anyone's claim | Succeeds | HIGH |
| Non-host tries to unclaim another's claim | Throws "Not authorized" error | HIGH |

**Sources:** [OWASP A01 Broken Access Control](https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/), [Convex Authorization Best Practices](https://stack.convex.dev/authorization)

### Calculation Tests (Table Stakes)

**Must test (financial accuracy):**

| Scenario | Expected Behavior | Confidence |
|----------|-------------------|------------|
| Split item evenly (1000 cents / 3 = [334, 333, 333]) | Remainder goes to first claimants | HIGH |
| Zero claimants | Returns empty array | HIGH |
| Single claimant | Returns full amount | HIGH |
| Tax distribution proportional to subtotal | Sum equals total tax | HIGH |
| Manual tip distribution | Sum equals tip amount | HIGH |
| Percent tip on subtotal | Correct percentage calculation | HIGH |
| Percent tip on total (subtotal + tax) | Includes tax in base | HIGH |
| All zeros (no claims, no items) | Returns zero totals gracefully | HIGH |

**Sources:** [Convex Testing Patterns](https://stack.convex.dev/testing-patterns), standard financial testing practices

### Mutation Tests (Table Stakes)

**Must test (core business logic):**

| Scenario | Expected Behavior | Confidence |
|----------|-------------------|------------|
| Create session generates unique 6-char code | Code matches /^[A-Z0-9]{6}$/ | HIGH |
| Create session creates host as first participant | Host has isHost=true | HIGH |
| Join session with valid code | Creates participant, returns ID | HIGH |
| Join session with duplicate name | Throws "name already taken" error | HIGH |
| Add item validates name/price | Rejects empty name, negative price | HIGH |
| Claim item is idempotent | Second claim returns same ID | HIGH |
| Update tip saves to session | Session has tipType and tipValue | HIGH |
| Remove item deletes associated claims | Claims cascade deleted | HIGH |

**Sources:** [Convex convex-test Docs](https://docs.convex.dev/testing/convex-test)

### E2E Flow Tests (Table Stakes)

**Must test (critical user journeys):**

| Flow | Steps | Confidence |
|------|-------|------------|
| Host creates bill | Navigate → Enter name → See items page | HIGH |
| Host adds items | Click add → Enter name/price → See in list | HIGH |
| Host sets tip | Click tip → Select percent → See updated totals | HIGH |
| Guest joins via code | Enter code → Enter name → See items | HIGH |
| Guest claims item | Click item → See claim indicator → See in "My Items" | HIGH |
| Guest sees totals | Navigate to summary → See itemized breakdown | HIGH |

**Sources:** [Playwright E2E Docs](https://playwright.dev/), industry best practices

### Real-time Sync Tests (Differentiator)

**Should test (collaborative feature validation):**

| Scenario | Expected Behavior | Confidence |
|----------|-------------------|------------|
| Host adds item, guest sees it | Item appears without page refresh | MEDIUM |
| Guest claims item, host sees claim | Claim indicator updates in real-time | MEDIUM |
| Host updates tip, all see new totals | Summary updates across all sessions | MEDIUM |
| Multiple guests join simultaneously | All participants visible in list | LOW |

**Implementation approach:** Use Playwright's multiple BrowserContext to simulate concurrent users. Convex subscriptions should auto-update UI.

**Sources:** [Playwright BrowserContext](https://playwright.dev/docs/browser-contexts), [WebSocket Testing Best Practices](https://www.thegreenreport.blog/articles/websocket-testing-essentials-strategies-and-code-for-real-time-apps/websocket-testing-essentials-strategies-and-code-for-real-time-apps.html)

## Coverage Targets

Based on industry standards and project constraints:

| Category | Target Coverage | Rationale |
|----------|-----------------|-----------|
| Authorization logic | 100% | Security-critical; no regressions allowed |
| Calculation functions | 100% | Financial accuracy; pure functions are easy to test |
| Core mutations | 80%+ | Business logic; focus on happy paths + key errors |
| Queries | 60%+ | Read-only; lower risk |
| E2E flows | Critical paths | 2 flows (host, join) cover 80% of usage |
| Overall backend | 70-80% | Industry standard for balanced coverage |

**Sources:** [Code Coverage Best Practices](https://www.qt.io/quality-assurance/blog/is-70-80-90-or-100-code-coverage-good-enough), [Bullseye Minimum Coverage](https://www.bullseye.com/minimum.html)

## Technology Recommendations

### Backend Testing (convex-test + Vitest)

**Recommended stack:**
- `convex-test` — Mock Convex backend for fast unit tests
- `vitest` — Fast test runner with ESM support
- `@edge-runtime/vm` — Required for convex-test

**Why:** Official Convex testing library; fast execution; works with existing schema.

**Sources:** [Convex Testing Docs](https://docs.convex.dev/testing/convex-test), [convex-test npm](https://www.npmjs.com/package/convex-test)

### E2E Testing (Playwright)

**Recommended over Cypress because:**
- Multi-browser context support (critical for real-time sync testing)
- Native parallelism for faster CI
- WebKit support for Safari testing (future)
- Better handling of multiple tabs/windows

**Sources:** [Playwright vs Cypress 2024](https://momentic.ai/resources/playwright-vs-cypress-the-2024-definitive-guide-for-e2e-testing), [Playwright Multi-Context](https://playwright.dev/docs/browser-contexts)

### Future: Load Testing (Artillery)

**When ready:**
- Artillery for WebSocket load testing
- Simulate 1000+ concurrent connections
- Defer until v1.3+ when scale is known

**Sources:** [Artillery WebSocket Testing](https://www.artillery.io/docs/reference/engines/websocket)

## Sources

### Official Documentation (HIGH confidence)
- [Convex Testing Docs](https://docs.convex.dev/testing/convex-test)
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization)
- [Convex Testing Patterns](https://stack.convex.dev/testing-patterns)
- [OWASP A01 Broken Access Control](https://owasp.org/Top10/2021/A01_2021-Broken_Access_Control/)
- [OWASP Authorization Testing](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/README)
- [Playwright Documentation](https://playwright.dev/)

### Industry Best Practices (MEDIUM confidence)
- [Code Coverage Targets](https://www.qt.io/quality-assurance/blog/is-70-80-90-or-100-code-coverage-good-enough)
- [WebSocket Testing Essentials](https://www.thegreenreport.blog/articles/websocket-testing-essentials-strategies-and-code-for-real-time-apps/websocket-testing-essentials-strategies-and-code-for-real-time-apps.html)
- [Playwright vs Cypress 2024](https://momentic.ai/resources/playwright-vs-cypress-the-2024-definitive-guide-for-e2e-testing)
- [Financial App Testing](https://aqua-cloud.io/types-of-test-cases-to-apply-when-testing-financial-applications/)
- [Mutation Testing Guide](https://mastersoftwaretesting.com/testing-fundamentals/types-of-testing/mutation-testing)

### Tools & Libraries (HIGH confidence)
- [convex-test npm](https://www.npmjs.com/package/convex-test)
- [Vitest](https://vitest.dev/)
- [Artillery](https://www.artillery.io/)

---
*Test foundation research for: Split (bill splitting app)*
*Researched: 2026-01-15*

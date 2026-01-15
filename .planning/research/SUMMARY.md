# Project Research Summary

**Project:** Split (bill splitting app)
**Domain:** Testing for real-time collaborative web app (Convex + React + Vite)
**Researched:** 2026-01-15
**Confidence:** HIGH

## Executive Summary

This research covers testing infrastructure for an existing Convex + React bill-splitting app (v1.1 shipped). The goal is to establish a test foundation that prevents regressions in authorization, calculations, and real-time sync.

The recommended approach is a two-tier testing strategy: **convex-test** for fast backend unit tests and **Playwright** for E2E browser tests with multi-user simulation. This combination provides full coverage of Convex function logic while testing real-time WebSocket sync between participants.

Key risks include flaky tests from WebSocket timing, localStorage session leakage between parallel tests, and convex-test mock limitations. These are mitigated by proper test isolation (browser contexts), avoiding `waitForTimeout`, and supplementing with integration tests for edge cases.

## Key Findings

### Recommended Stack

Vitest + convex-test for backend unit tests, Playwright for E2E. This is the officially recommended Convex testing stack as of 2025.

**Core technologies:**
- **Vitest v3.0+**: Test runner — native Vite integration, 10-20x faster than Jest, official Convex recommendation
- **convex-test v0.0.41**: Convex mock backend — fast in-memory testing with schema validation, auth simulation
- **Playwright v1.50+**: E2E testing — WebSocket interception, multi-browser contexts for real-time sync testing
- **@edge-runtime/vm**: Required for convex-test to emulate Convex runtime

### Expected Features

**Must have (table stakes):**
- Authorization unit tests (100% coverage on auth checks)
- Calculation unit tests (100% coverage on financial logic)
- Core mutation tests (create, join, claim, tip/tax)
- E2E host flow (create bill → add items → set tip)
- E2E join flow (enter code → claim items → see totals)

**Should have (competitive):**
- Real-time sync E2E (multi-context test verifying instant updates)
- Error handling tests (invalid codes, duplicate names)

**Defer (v2+):**
- Load testing (premature for current scale)
- Visual regression testing
- Mutation testing (Stryker)

### Architecture Approach

Tests are organized by layer: Convex function tests co-located in `convex/*.test.ts`, E2E tests in separate `tests/e2e/` folder. Each convex-test call gets a fresh mock database (no cleanup needed). E2E tests use Playwright browser contexts for user isolation.

**Major components:**
1. **convex/*.test.ts** — Unit tests for mutations, queries, calculations
2. **tests/e2e/*.spec.ts** — Browser automation for user flows
3. **tests/fixtures/** — Reusable Playwright fixtures for host/participant setup

### Critical Pitfalls

1. **Flaky tests from WebSocket timing** — Use Playwright's `waitForResponse` instead of `waitForTimeout`
2. **localStorage leaking between tests** — Use separate browser contexts, clear storage in setup
3. **convex-test doesn't match production** — Supplement with integration tests, don't rely on error message content
4. **Missing authorization boundary tests** — Test both "can authorized user do X" AND "can unauthorized user NOT do X"
5. **Optimistic updates masking failures** — Assert on database state, not just UI

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Test Infrastructure Setup
**Rationale:** Foundation must exist before writing tests
**Delivers:** Vitest + convex-test + Playwright configured and running
**Addresses:** Config, environments, npm scripts
**Avoids:** convex-test configuration gotchas (edge-runtime, inline deps)

### Phase 2: Backend Unit Tests
**Rationale:** Fast feedback loop on critical logic
**Delivers:** Unit tests for authorization, calculations, core mutations
**Uses:** convex-test with t.withIdentity() for auth simulation
**Implements:** 100% coverage on auth/calculations, 80%+ on mutations

### Phase 3: E2E Tests
**Rationale:** Validate full user flows after unit tests pass
**Delivers:** Host flow, join flow, real-time sync tests
**Uses:** Playwright multi-context for simulating multiple users
**Avoids:** Flaky tests by using proper waits, not timeouts

### Phase Ordering Rationale

- Infrastructure first: Can't write tests without test runner configured
- Unit tests before E2E: Faster feedback, catch bugs early
- Auth tests prioritized: Security-critical, OWASP Top 10 A01
- E2E last: Most expensive to write/maintain, covers integration

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (E2E):** Multi-context fixture patterns, WebSocket wait strategies — some experimentation needed

Phases with standard patterns (skip research-phase):
- **Phase 1:** Well-documented convex-test setup
- **Phase 2:** Standard unit test patterns with convex-test examples

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official Convex docs, verified npm packages |
| Features | MEDIUM | Industry patterns + Convex-specific guidance |
| Architecture | HIGH | Official convex-test + Playwright docs |
| Pitfalls | MEDIUM | Community experience + official warnings |

**Overall confidence:** HIGH

### Gaps to Address

- **convex-test mock limitations:** May need integration tests against local backend for edge cases
- **Multi-user E2E patterns:** Some experimentation needed for optimal fixture setup
- **CI configuration:** Research didn't cover GitHub Actions / CI-specific setup

## Sources

### Primary (HIGH confidence)
- [Convex Testing Docs](https://docs.convex.dev/testing) — official overview
- [convex-test Documentation](https://docs.convex.dev/testing/convex-test) — mock backend API
- [Playwright Documentation](https://playwright.dev/) — E2E testing
- [Playwright Browser Contexts](https://playwright.dev/docs/browser-contexts) — multi-user isolation

### Secondary (MEDIUM confidence)
- [Testing React Components with Convex](https://stack.convex.dev/testing-react-components-with-convex) — ConvexReactClientFake patterns
- [Convex Testing Patterns](https://stack.convex.dev/testing-patterns) — best practices
- [Liveblocks E2E Testing](https://liveblocks.io/blog/e2e-tests-with-puppeteer-and-jest-for-multiplayer-apps) — multi-user patterns

### Tertiary (LOW confidence)
- None used — avoided unverified claims

---
*Research completed: 2026-01-15*
*Ready for roadmap: yes*

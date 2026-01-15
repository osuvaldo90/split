# Phase 15: Test Infrastructure - Context

**Gathered:** 2026-01-15
**Status:** Ready for planning

<vision>
## How This Should Work

One command runs everything. `npm test` kicks off all tests — unit tests with convex-test mocking the database, and eventually E2E tests with Playwright. No separate commands to remember, no decision about what to run. Just run the tests.

The goal is confidence to ship. Tests are a safety net that lets you change code without worry. When tests pass, you know nothing broke. Ship it.

</vision>

<essential>
## What Must Be Nailed

- **Confidence to ship** — Tests exist so you can modify code fearlessly. If tests pass, you can deploy.
- **Clear failures** — When something breaks, know immediately what failed and where. No hunting through logs or cryptic error messages.

</essential>

<specifics>
## Specific Ideas

- Single `npm test` command runs everything
- Failures should be obvious — the test name and assertion should make it clear what went wrong

</specifics>

<notes>
## Additional Context

This is the foundation phase — just getting the test runners configured. The actual test coverage comes in phases 16-19 (authorization, calculations, mutations, E2E).

</notes>

---

*Phase: 15-test-infrastructure*
*Context gathered: 2026-01-15*

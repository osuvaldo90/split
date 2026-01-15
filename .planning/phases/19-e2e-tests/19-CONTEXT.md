# Phase 19: E2E Tests - Context

**Gathered:** 2026-01-15
**Status:** Ready for planning

<vision>
## How This Should Work

End-to-end tests that verify complete user journeys work from start to finish. A test should simulate what real users do: one person creates a bill, scans a receipt, shares the link. Another person joins, claims their items, sees their total. Both see the right numbers.

These aren't testing individual components — they're testing that the whole experience works. If a user can complete the flow without getting stuck, the test passes.

</vision>

<essential>
## What Must Be Nailed

- **Complete host flow** — Create session → scan receipt → see items → share link → view everyone's totals
- **Complete join flow** — Open link → enter name → see items → claim items → see your total
- **The full cycle together** — Host creates, participant joins, both see correct results

</essential>

<specifics>
## Specific Ideas

- Receipt scanning should be mocked — not testing AI's ability to parse receipts, just testing what happens after receipt data exists
- Focus on flow completion — can users actually finish the bill-splitting process?

</specifics>

<notes>
## Additional Context

This is the final phase of v1.2 Test Foundation. Backend unit tests (authorization, calculations, mutations) are complete in phases 15-18. These E2E tests complete the test coverage by verifying the user-facing flows.

</notes>

---

*Phase: 19-e2e-tests*
*Context gathered: 2026-01-15*

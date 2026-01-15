# Phase 16: Authorization Tests - Context

**Gathered:** 2026-01-15
**Status:** Ready for planning

<vision>
## How This Should Work

Full coverage of every authorization scenario in the app. Tests should verify who can see and edit what — sessions, items, and claims. Every access boundary should be tested so we know the authorization layer is airtight.

</vision>

<essential>
## What Must Be Nailed

- **Session isolation** — Users can only access/modify their own sessions, no cross-session leaks
- **Host vs participant roles** — Host has elevated powers (edit items, manage session), participants limited to claiming
- **Claim ownership** — Users can only modify their own claims, can't mess with others'

All three boundaries are equally critical. Comprehensive coverage across all authorization rules.

</essential>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for Convex authorization testing.

</specifics>

<notes>
## Additional Context

The core value of these tests is **confidence to ship** — knowing the authorization layer is solid before deploying any changes. This is about having a safety net that lets us move fast without worrying about access control regressions.

</notes>

---

*Phase: 16-authorization-tests*
*Context gathered: 2026-01-15*

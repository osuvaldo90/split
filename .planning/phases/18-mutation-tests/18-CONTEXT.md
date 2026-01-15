# Phase 18: Mutation Tests - Context

**Gathered:** 2026-01-15
**Status:** Ready for planning

<vision>
## How This Should Work

Comprehensive test coverage for all write operations in the system. Every mutation across sessions, items, and claims gets tested to ensure the backend behaves correctly when data changes.

</vision>

<essential>
## What Must Be Nailed

- **Authorization enforcement** - Each mutation correctly checks who can perform the action
- **Data integrity** - Mutations leave the database in correct, consistent states

</essential>

<specifics>
## Specific Ideas

No specific requirements - open to standard approaches that follow the patterns established in Phase 16 (Authorization Tests) and Phase 17 (Calculation Tests).

</specifics>

<notes>
## Additional Context

This follows the v1.1 Access Control milestone where authorization rules were implemented. The mutation tests validate that those rules are properly enforced on every write operation.

</notes>

---

*Phase: 18-mutation-tests*
*Context gathered: 2026-01-15*

# Phase 17: Calculation Tests - Context

**Gathered:** 2026-01-15
**Status:** Ready for planning

<vision>
## How This Should Work

Exhaustive test coverage for all financial calculations. Every edge case in the math — remainders, rounding, proportional distribution — should be tested before users encounter them. The tests should catch any scenario where the math could produce unexpected or unfair results.

</vision>

<essential>
## What Must Be Nailed

- **Remainder handling** — When amounts don't divide evenly (e.g., $10 split 3 ways), the extra penny must go somewhere predictable and fair
- **Equal rigor everywhere** — Rounding, proportional tax/tip distribution, all calculation dimensions need the same level of test coverage
- **No mathematical surprises** — Every edge case caught in tests, not discovered by users

</essential>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for comprehensive calculation testing.

</specifics>

<notes>
## Additional Context

The core worry is the classic bill-splitting penny problem: odd amounts that don't split evenly. Tests need to verify that remainder handling is predictable and consistent.

</notes>

---

*Phase: 17-calculation-tests*
*Context gathered: 2026-01-15*

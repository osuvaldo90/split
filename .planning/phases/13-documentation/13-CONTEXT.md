# Phase 13: Documentation - Context

**Gathered:** 2026-01-15
**Status:** Ready for planning

<vision>
## How This Should Work

Developer-focused documentation with a clean split:
- **README.md** at root for quick start — local setup, how to run, environment config
- **docs/ folder** for deeper content — architecture, key patterns, design decisions

The goal is helping future contributors (or future me) understand the codebase quickly. Not comprehensive API reference, but the "why" behind the code — what patterns we chose and why they work.

</vision>

<essential>
## What Must Be Nailed

- **Local setup guide** in README — get running in minutes, not hours
- **Key patterns documented** — claims model, participant verification, draft state, real-time sync approach
- **Architecture clarity** — understand how the pieces fit without reading all the code

</essential>

<specifics>
## Specific Ideas

- README.md: Quick intro + local setup (environment, Convex config, common issues)
- docs/architecture.md: Key patterns and design decisions
- Keep .planning/ folder separate — that's dev process, not code documentation
- Minimal and maintainable — no fluff, quick to read

</specifics>

<notes>
## Additional Context

This is the final phase of v1.0 MVP. Documentation should help onboard contributors without being a maintenance burden. Focus on the patterns that make this codebase unique (real-time bill splitting, collaborative editing) rather than generic Convex/React docs.

</notes>

---

*Phase: 13-documentation*
*Context gathered: 2026-01-15*

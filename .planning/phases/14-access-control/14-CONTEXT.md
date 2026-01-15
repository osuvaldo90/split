# Phase 14: Access Control - Context

**Gathered:** 2026-01-15
**Status:** Ready for planning

<vision>
## How This Should Work

When someone navigates to a bill URL without being a participant, they see that the bill exists and are prompted to join. They can't see the actual items, amounts, or any bill content until they've joined the session.

The frontend should never be in a state where it sends unauthorized requests. If a non-participant somehow triggers an API mutation, the API enforces authorization rules and the app treats it as an unexpected error — there's no special "you need to join first" UI flow for rejected mutations because that state shouldn't happen in normal use.

Host-only operations (tax/tip editing) continue working as they do now, just with proper server-side enforcement.

</vision>

<essential>
## What Must Be Nailed

- **Route protection comes first** — Non-participants cannot see bill content at `/bill/:id`. They see the bill exists and get prompted to join, but items/amounts are hidden until they're in.
- **Clean separation** — The UI handles the "not joined yet" state at the route level; the API simply enforces authorization. No complex rejection-handling flows needed.

</essential>

<specifics>
## Specific Ideas

No specific requirements — standard approach of checking participant status before rendering bill content, with API-level enforcement on all mutations.

</specifics>

<notes>
## Additional Context

This builds on the security hardening from Phase 12. The existing join flow already works; this phase adds the gate that prevents viewing content before joining.

Priority order: route protection > mutation security > host privilege enforcement.

</notes>

---

*Phase: 14-access-control*
*Context gathered: 2026-01-15*

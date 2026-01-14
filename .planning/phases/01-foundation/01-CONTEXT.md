# Phase 1: Foundation - Context

**Gathered:** 2026-01-14
**Status:** Ready for research

<vision>
## How This Should Work

A minimal viable setup that gets us coding fast with just enough structure. The foundation needs to be ready for real-time from day one — architecture that won't fight us when we add live sync later.

The app has a clear host model: one person creates a session, shares a code, and can add people or claim items on their behalf. Others join via the code. No accounts, no friction — instant collaborative splitting.

Tech stack should be determined by the functional requirements (real-time collaboration, mobile-first, OCR integration) rather than predetermined. Hosting is flexible — whatever makes sense for the architecture.

</vision>

<essential>
## What Must Be Nailed

- **Real-time ready architecture** — The foundation must support live sync without major refactoring later. This is a collaborative app at its core.
- **Mobile-first from the start** — Not bolted on later. The primary use case is people at a restaurant on their phones.
- **Host/participant model** — Clear distinction where host creates sessions, shares codes, and can act on behalf of others.

</essential>

<specifics>
## Specific Ideas

- Minimal setup — just enough structure to start building features
- Tech stack to be determined during research based on requirements (real-time, mobile-first, OCR)
- No offline requirements — assume connectivity for real-time features
- Session data persistence TBD — ephemeral vs short-term needs exploration

</specifics>

<notes>
## Additional Context

The user wants to move fast but not fight the architecture later. Key insight: the "host" role is central to the UX — they're the coordinator who shares access and can manage claims for others at the table.

Hosting platform is flexible. Focus is on getting the real-time collaborative foundation right so subsequent phases (OCR, sessions, sync, claiming) build naturally on top.

</notes>

---

*Phase: 01-foundation*
*Context gathered: 2026-01-14*

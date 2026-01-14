# Phase 3: Session Management - Context

**Gathered:** 2026-01-14
**Status:** Ready for planning

<vision>
## How This Should Work

After scanning a receipt, the person taps "Share this bill" and gets a short, speakable code — something like "TACO" or "BURGER" that's easy to say across the table. No QR codes for now.

Friends open the app, enter the code, pick a display name, and they're in. Two steps, done. The person who scanned the receipt is automatically a participant too — they just need to pick their name like everyone else.

Once joined, everyone sees a simple list of who's in the session. Names only, nothing fancy. From there, they'll be ready to start claiming items.

</vision>

<essential>
## What Must Be Nailed

- **Speed to join** — Getting everyone in quickly with minimal friction
- **Easy sharing** — The host can easily share the code (clear display, copy button)
- **Know who's in** — See who has joined the session before claiming starts
- **Unique names** — No duplicate display names within a session to avoid confusion

</essential>

<specifics>
## Specific Ideas

- Code-first, no QR codes (QR can be post-release)
- Codes should be short and speakable — easy to say out loud at a table
- Session creation happens AFTER scanning a receipt (you need items before you need people)
- Scanner is auto-joined as a participant (no special "host" role)
- Simple name list for participants — no avatars or colors
- Prevent duplicate names within a session

</specifics>

<notes>
## Additional Context

Session lifetime/expiration not a priority — can figure out sensible defaults during implementation.

</notes>

---

*Phase: 03-session-management*
*Context gathered: 2026-01-14*

# Phase 4: Real-Time Sync - Context

**Gathered:** 2026-01-14
**Status:** Ready for research

<vision>
## How This Should Work

When multiple people are in a session, everyone sees the same thing — instantly. Someone claims an item and it updates on everyone's screen right away. No refresh button, no "pull to refresh", just live updates.

The initial load should be fast — show what we have immediately, then start live updates. When someone opens the session for the first time, they shouldn't wait; they see the current state and can start looking at items right away.

Participants should see who else is in the session — a visible list somewhere. When someone new joins, there's a brief "Mike joined" notification that fades away. People should know when their friends arrive, but it shouldn't be disruptive.

If the connection drops (phone signal issues at the restaurant), show a brief "Reconnecting..." indicator so people know something happened, then clear it once restored. Simple reconnection — no complex offline mode needed. And when you refresh or revisit the session URL, you're still you — no need to re-enter your name.

</vision>

<essential>
## What Must Be Nailed

- **Reliability over speed** — A claim should never get lost or show differently to different people. That would cause chaos at the table. Better to be slightly slower but never lose data.
- **Clear visual feedback on updates** — At a noisy restaurant table, subtle changes get missed. When something changes, people need to see it.
- **Session persistence across visits** — Refreshing the browser shouldn't make you re-enter your name. You're still you.
- **Participant visibility** — Essential to see who's joined the session.

</essential>

<specifics>
## Specific Ideas

- Updates show the result, not the action — item shows Sarah's name now, but no "Sarah just claimed this" toast/notification
- Multiple people can claim the same item (shared items are normal — splitting a pizza)
- Brief "Reconnecting..." when connection drops, clears when restored
- Subtle "Mike joined" notification when someone new joins
- Fast initial load — show current state immediately, don't make people wait

</specifics>

<notes>
## Additional Context

Includes todo from pending: "Persist participant session across visits" — fits naturally with reconnection handling. The experience of refreshing should feel seamless; you're still connected, still see your claims.

Two related pending todos NOT included in this phase:
- "Redo Session UI information architecture" — may inform display but is a separate concern
- "Remove confirm step, inline editing" — Phase 5 (Item Management) territory

</notes>

---

*Phase: 04-real-time-sync*
*Context gathered: 2026-01-14*

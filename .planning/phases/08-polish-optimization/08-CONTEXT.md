# Phase 8: Polish & Optimization - Context

**Gathered:** 2026-01-14
**Status:** Ready for planning

<vision>
## How This Should Work

Smooth out the rough edges — fix the UX annoyances noticed during testing. The app works, but it should feel polished and intentional.

**Header consolidation:** The current layout wastes screen real estate. The top header just says "Split" and provides no value. The next header shows session ID and host with a "share this bill" CTA — lots of redundancy. Remove "hosted by" (user list already shows host). Convert "Session: <ID>" header into a tappable share/copy CTA instead of repeating the session ID with a separate blue button.

**Single scroll area:** After header consolidation, there should be one scrollable area with 3 stacked sections: "Who's Here", "Receipt", and "Items". All visible, scroll together vertically. No nested scroll frames.

**Compact UI:** Item rows are too tall — each takes more vertical space than needed. Tighten them up.

**Animations:** Brief color flash on rows when items update, fades quickly. Claim pills should flash in when someone claims (brief highlight, fade to normal color). Unclaim should fade out the pill before it disappears.

</vision>

<essential>
## What Must Be Nailed

- **Header redesign** — Remove redundancy, make share CTA the natural action on the header itself (tap to copy code, show toast)
- **Single scroll frame** — Eliminate nested scrolling confusion, one continuous vertical scroll
- **Item row compactness** — More items visible at once, less wasted vertical space
- **Edit overflow fix** — Desktop inline edit buttons must not overflow and create horizontal scrollbar

</essential>

<specifics>
## Specific Ideas

**Share interaction:**
- Tap header to copy session code to clipboard
- Show toast confirmation

**Sections layout:**
- Stacked always-visible: Who's Here → Receipt → Items
- All scroll together as one view

**Animations:**
- Item row flash on update (brief highlight, quick fade)
- Claim pill: flash highlight color → fade to normal
- Unclaim pill: fade out → remove from list

**Input UX polish (also included):**
- Improve item count input UX (deferred from Phase 2.1)
- Auto-insert decimal when editing item price

**Visual polish (also included):**
- Animate item updates with flash/fade
- User-friendly error messages

</specifics>

<notes>
## Additional Context

Todos being addressed in this phase:
- Remove unnecessary app header with Split
- Redo Session UI with better information architecture
- Handle strange multi-frame scrolling issues
- Fix inline item edit mode layout overflow
- Improve item count input UX
- Auto-insert decimal when editing item price
- Animate item updates with flash/fade
- User-friendly error messages

This is the final phase — focus on making what exists feel polished, not adding new features.

</notes>

---

*Phase: 08-polish-optimization*
*Context gathered: 2026-01-14*

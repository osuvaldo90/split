# Phase 10: Feature Enhancements - Context

**Gathered:** 2026-01-15
**Status:** Ready for planning

<vision>
## How This Should Work

This phase is cleanup for v1 release — miscellaneous polish items, not a cohesive new feature.

**Auto-gratuity detection:** On the tax & tip screen, there's a dedicated auto-gratuity line that's always visible (defaults to $0 if not detected). When OCR detects gratuity on a receipt, it pre-fills this field. The UI should make it clear this value came from the receipt scan. The separate tip field remains for additional tip — users understand that editing it adds on top of any auto-gratuity.

**Bill history:** A simple list on the home screen showing recent bills (date + total). Stored in localStorage (this device only). Tapping a bill rejoins if it's still active, or shows a view-only summary if closed.

**Session → Bill rename:** Replace "session" terminology throughout the app with "bill". The shareable code stays simple — just "Share code: ABC123" without a "Bill" prefix.

</vision>

<essential>
## What Must Be Nailed

- **Auto-gratuity as a separate, always-visible line** — not mixed in with optional tip. Users must see that gratuity was detected from the receipt.
- **Clear distinction between detected gratuity and additional tip** — one is pre-filled from OCR, the other is what they choose to add.

</essential>

<specifics>
## Specific Ideas

- Auto-gratuity line always shows on tax/tip screen, even if $0
- Bill history shows minimal info: date + total
- History is local to device (localStorage)
- Tapping history item rejoins active bills, shows summary for closed ones
- Shareable code has no "Bill" prefix — just "Share code: ABC123"

</specifics>

<notes>
## Additional Context

Multi-item UX removed from this phase's scope — not needed for v1.

Features in scope:
1. Auto-gratuity detection and display
2. Bill history on home screen
3. Session → Bill rename throughout codebase

</notes>

---

*Phase: 10-feature-enhancements*
*Context gathered: 2026-01-15*

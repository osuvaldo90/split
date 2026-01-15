# Phase 6: Calculation Engine - Context

**Gathered:** 2026-01-14
**Status:** Ready for planning

<vision>
## How This Should Work

As people claim items, their total updates in real-time — tax and tip just happen automatically. No manual "calculate" button, no waiting. The numbers are always live.

There are three distinct screens with bottom tab navigation:
1. **Items** — where you claim/edit items (existing)
2. **Tax & Tip** — where the host configures tip and tax settings
3. **Summary** — where everyone sees all participants' totals

The summary screen shows everyone's totals at a glance. Each person's breakdown shows category totals (Items: $X, Tax: $Y, Tip: $Z, Total: $W) with tap-to-expand for the itemized list of what they claimed.

All screens update in real-time as claims change — even if you're on the summary screen, totals shift live.

</vision>

<essential>
## What Must Be Nailed

- **Transparency** — users can see how their total breaks down (items, tax share, tip share). No mystery math.
- **Live updates** — totals update the moment someone claims/unclaims an item
- **Single group tip** — host sets tip once for the table, everyone's share auto-calculated

</essential>

<specifics>
## Specific Ideas

**Tip Settings:**
- Simple free input for tip percentage (no preset buttons)
- Choice of what tip applies to: subtotal only OR subtotal + tax
- Host only can set/change tip; others can view but not edit
- If auto-gratuity detected on receipt: show it, but still allow adding extra tip on top

**Tax Settings:**
- Pre-fill from receipt OCR, allow host to override if wrong
- Optional — defaults to $0 if no receipt and host doesn't enter

**Unclaimed Items:**
- Show warning about unclaimed items but don't block
- Exclude unclaimed items from totals (they don't factor into anyone's share)

**Verification:**
- Only show warning when group total doesn't match receipt total
- Keep UI clean when everything adds up; alert when something's off

**Navigation:**
- Bottom tabs: Items | Tax & Tip | Summary
- Tax & Tip screen: everyone can see settings, only host can edit

**Rounding:**
- Needs research to determine fairest approach for cent distribution

</specifics>

<notes>
## Additional Context

**Related todo:** "Detect auto-gratuity on receipts" — update parseReceipt.ts to detect and return auto-gratuity as a separate field. This affects tip calculation (show existing gratuity, allow extra tip).

**Phase 7 overlap:** The summary screen UI details (styling, layout, original receipt display) will be refined in Phase 7. Phase 6 focuses on the calculation logic and basic display structure.

</notes>

---

*Phase: 06-calculation-engine*
*Context gathered: 2026-01-14*

# Phase 5: Item Management - Context

**Gathered:** 2026-01-14
**Status:** Ready for planning

<vision>
## How This Should Work

Tap to claim. That's it. You see an item on the bill, you tap it, it's yours. Your name appears under the item. Tap again to remove yourself.

If someone else already claimed an item and you tap it too, you're both on it now — the cost splits automatically between everyone who tapped. An appetizer three people shared? All three tap it, each pays a third. No separate "split" flow, no dialogs — just tap.

Items you've claimed should stand out visually so you can scan the list and instantly see "my stuff." Unclaimed items should look different too — faded or with some indicator — so it's obvious what still needs someone to claim it.

The host has a bit more power: they can unclaim anyone from any item to fix mistakes. Regular users can only remove themselves.

</vision>

<essential>
## What Must Be Nailed

- **Clarity of ownership** - Always crystal clear who claimed what. Names listed under each item. No ambiguity about who's paying for what.
- **My claims stand out** - Visual distinction for items I've claimed so I can scan and see my stuff instantly
- **Unclaimed visibility** - Obvious which items still need to be claimed

</essential>

<specifics>
## Specific Ideas

- Tap to claim, tap again to unclaim yourself
- Tapping an already-claimed item adds you as another claimer (shared)
- Names listed under each item showing all claimers
- Items I've claimed have visual distinction (border, background, or indicator)
- Unclaimed items look faded or have a warning indicator
- Host can unclaim anyone; regular users only themselves
- Claim the whole item even if quantity > 1 (split cost if shared)
- No running totals yet — that's Phase 7
- Keep inline editing as-is from Phase 3.1

</specifics>

<notes>
## Additional Context

Line item editing was already added in Phase 3.1 with anyone-can-edit. No changes needed to that system — it stays as-is.

Phase 2.1 already splits quantity items into separate lines (2x Pilsner becomes 2 separate Pilsner items), but if something still has quantity, claiming claims the whole thing.

Totals and calculations come in Phase 6/7 — this phase is purely about claiming and visual clarity.

</notes>

---

*Phase: 05-item-management*
*Context gathered: 2026-01-14*

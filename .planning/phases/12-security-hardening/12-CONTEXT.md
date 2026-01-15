# Phase 12: Security Hardening - Context

**Gathered:** 2026-01-15
**Status:** Ready for planning

<vision>
## How This Should Work

Security should be invisible. Users should never see error messages or hit walls — unauthorized actions simply don't happen. The app continues to feel collaborative and frictionless, but the backend silently enforces proper authorization boundaries.

When someone tries something they shouldn't (like editing another person's name), it's a silent no-op. No error toast, no feedback, nothing. The action just doesn't take effect.

</vision>

<essential>
## What Must Be Nailed

- **Complete the audit findings** — This isn't about picking the most important fixes. All HIGH and MEDIUM priority issues from the security audit should be addressed as a cohesive whole.
- **Invisible protection** — Users never notice security is there. It just works.
- **Backend-only changes** — No UI modifications needed. The frontend can stay as-is; we're just closing the gaps between what the UI allows and what the API allows.

</essential>

<specifics>
## Specific Ideas

- Sensible defaults for input validation (I'll figure out reasonable limits during implementation)
- Silent no-ops for unauthorized actions (not error messages)
- Scope: HIGH + MEDIUM priority issues only (11 total), skip LOW priority

**HIGH priority (2):**
1. `participants.updateName` - verify caller owns participant or is host
2. `claims.unclaim` - verify caller owns claim or is host

**MEDIUM priority (9):**
3. `sessions.updateTip/updateTax/updateGratuity` - restrict to host
4. `items.update` - add session verification
5. `items.remove` - restrict to host
6. `items.addBulk` - restrict to host (destructive operation)
7. Name length limits (names capped at reasonable length)
8. Numeric bounds (no negative prices, reasonable upper limits)
9. `receipts.getReceiptUrl` - add sessionId verification

</specifics>

<notes>
## Additional Context

The Phase 11 security audit (SECURITY-AUDIT.md) provides detailed analysis of each issue including code examples and recommended fixes. That document should guide implementation.

Some audit findings were identified as "intentional design choices" vs "security gaps":
- Anyone can add/edit items — intentional collaborative behavior
- Anyone can claim for others — intentional collaborative behavior
- BUT: unclaiming others' items, changing others' names — these are gaps

The key insight: the API currently allows more than the UI intends. This phase closes that gap.

</notes>

---

*Phase: 12-security-hardening*
*Context gathered: 2026-01-15*

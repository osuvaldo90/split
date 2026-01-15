---
phase: 06-calculation-engine
plan: 01
subsystem: calculation
tags: [convex, query, math, real-time, proportional-distribution]

# Dependency graph
requires:
  - phase: 05-item-management
    provides: Claims system with item-participant relationships
provides:
  - Calculation utility functions (calculateItemShare, calculateTipShare, etc.)
  - participantTotals query with real-time per-participant breakdown
affects: [07-summary-display, tax-tip-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Remainder distribution for exact cent handling
    - Proportional calculation with distributeWithRemainder helper

key-files:
  created: [convex/calculations.ts]
  modified: [convex/participants.ts]

key-decisions:
  - "Use Math.floor + remainder distribution instead of rounding for exact cent handling"
  - "distributeWithRemainder helper ensures totals sum exactly to expected values"

patterns-established:
  - "Item share distribution: first N claimants get extra cent when price doesn't divide evenly"
  - "Tax/tip distribution: proportional to subtotal with remainder handling"

# Metrics
duration: 8min
completed: 2026-01-15
---

# Phase 6 Plan 01: Calculation Engine Summary

**Pure calculation functions for proportional tax/tip distribution and participantTotals query with real-time updates**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-15T02:50:53Z
- **Completed:** 2026-01-15T02:58:28Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created calculation utility functions with exact cent distribution
- Implemented participantTotals query returning per-participant breakdown
- Proper handling of unclaimed items (tracked separately, not included in totals)
- Support for all tip types: percent_subtotal, percent_total, manual

## Task Commits

Each task was committed atomically:

1. **Task 1: Create calculation utility functions** - `5f95901` (feat)
2. **Task 2: Create participantTotals query** - `915f2ac` (feat)

## Files Created/Modified

- `convex/calculations.ts` - Pure calculation functions:
  - `calculateItemShare`: Split item price with remainder to first claimants
  - `calculateSubtotalShare`: Participant's proportion of group subtotal
  - `calculateTaxShare`: Proportional tax based on subtotal ratio
  - `calculateTipShare`: Supports percent_subtotal, percent_total, manual
  - `calculateParticipantTotal`: Sum of subtotal, tax, tip
  - `distributeWithRemainder`: Helper for exact cent distribution
- `convex/participants.ts` - Added getTotals query returning:
  - Per-participant: subtotal, tax, tip, total, claimedItems
  - Unclaimed items tracked separately
  - Group totals and tip/tax settings

## Decisions Made

1. **Remainder distribution strategy** - For item splits, first N claimants get extra cent when price doesn't divide evenly (e.g., $10/3 = [334, 333, 333] cents). Consistent with 02.1-02 decision.

2. **distributeWithRemainder helper** - Created a general-purpose function to distribute totals proportionally while ensuring exact sum. Used for tax and manual tip distribution.

3. **Unclaimed items excluded from totals** - Per CONTEXT.md, unclaimed items are tracked separately and don't factor into anyone's share.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Calculation engine foundation complete
- Ready for 06-02-PLAN.md: Tax & Tip settings UI
- participantTotals query provides all data needed for summary screens

---
*Phase: 06-calculation-engine*
*Completed: 2026-01-15*

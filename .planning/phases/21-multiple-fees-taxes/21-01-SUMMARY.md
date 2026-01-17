---
phase: 21-multiple-fees-taxes
plan: 01
subsystem: api
tags: [convex, schema, crud, fees, taxes, distribution]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Convex schema foundation and session/items patterns
provides:
  - fees table with CRUD operations
  - getTotals with multiple fee distribution
  - backward compatible dual-read fallback for session.tax
affects: [21-02-prompt-update, 21-03-ui, parseReceipt]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dual-read migration pattern for schema evolution"
    - "Per-fee proportional distribution accumulation"

key-files:
  created:
    - convex/fees.ts
  modified:
    - convex/schema.ts
    - convex/participants.ts

key-decisions:
  - "Keep participant.tax field name for UI backward compatibility"
  - "Return fees array in getTotals for UI display"
  - "Max 50 fees per session in addBulk"

patterns-established:
  - "Dual-read fallback: check new table first, fall back to legacy field"

# Metrics
duration: 2min
completed: 2026-01-17
---

# Phase 21 Plan 01: Fees Table and CRUD Summary

**Multiple fees table with proportional distribution and backward-compatible fallback to session.tax field**

## Performance

- **Duration:** 2 min 15 sec
- **Started:** 2026-01-17T22:20:16Z
- **Completed:** 2026-01-17T22:22:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added fees table to Convex schema with sessionId index for multiple fee/tax records per session
- Created fees.ts with full CRUD operations (listBySession, add, addBulk, update, remove) with host-only authorization
- Updated getTotals to distribute multiple fees proportionally using existing distributeWithRemainder function
- Implemented dual-read fallback: reads from fees table first, falls back to session.tax for existing sessions

## Task Commits

Each task was committed atomically:

1. **Task 1: Add fees table and CRUD mutations** - `669cca8` (feat)
2. **Task 2: Update getTotals for multiple fees with fallback** - `e55c48d` (feat)

## Files Created/Modified

- `convex/schema.ts` - Added fees table definition with by_session index
- `convex/fees.ts` - New file with listBySession, add, addBulk, update, remove mutations
- `convex/participants.ts` - Updated getTotals to query fees table with fallback to session.tax

## Decisions Made

1. **Keep field names for backward compatibility** - participant.tax and totalTax field names retained in getTotals return value to avoid breaking existing UI code
2. **Return fees array** - Added fees array (label, amount) to getTotals return for UI display of individual fees
3. **Max 50 fees per session** - Set reasonable limit in addBulk to prevent abuse

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Fees table and CRUD ready for OCR prompt integration (21-02)
- getTotals returns fees array ready for UI display (21-03)
- Existing sessions continue working with automatic fallback

---
*Phase: 21-multiple-fees-taxes*
*Completed: 2026-01-17*

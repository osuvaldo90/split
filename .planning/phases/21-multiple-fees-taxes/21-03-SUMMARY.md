---
phase: 21-multiple-fees-taxes
plan: 03
subsystem: ui
tags: [react, legacy-migration, backward-compatibility]

# Dependency graph
requires:
  - phase: 21-02
    provides: fees table and OCR integration
provides:
  - Legacy session backward compatibility for fee display
  - Synthetic legacy fee rendering in TaxTipSettings
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Synthetic entity pattern: generate display-only objects from legacy fields"
    - "ID prefix convention for synthetic vs real entities (legacy-*)"

key-files:
  created: []
  modified:
    - src/pages/Session.tsx
    - src/components/TaxTipSettings.tsx

key-decisions:
  - "Use 'legacy-' prefix for synthetic fee IDs to distinguish from real DB IDs"
  - "Render legacy fees as read-only to prevent mutation attempts"

patterns-established:
  - "displayFees pattern: compute display data with fallback to legacy fields"

# Metrics
duration: 1min
completed: 2026-01-19
---

# Phase 21 Plan 03: Legacy Fee Display Fix Summary

**Backward compatibility for legacy sessions: displayFees computation with session.tax fallback and read-only rendering for synthetic legacy fees**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-19T16:22:41Z
- **Completed:** 2026-01-19T16:23:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Legacy sessions now show their tax value in the TaxTipSettings UI
- Synthetic legacy fees render as read-only (no edit/remove buttons)
- Host cannot accidentally trigger mutations on non-existent fee IDs
- UAT Test 8 (Backward Compatibility) gap closed

## Task Commits

Each task was committed atomically:

1. **Task 1: Add displayFees computation with legacy fallback** - `3a4acf3` (feat)
2. **Task 2: Render synthetic legacy fees as read-only** - `f7ef4ec` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `src/pages/Session.tsx` - Added displayFees useMemo with session.tax fallback, passes displayFees to TaxTipSettings
- `src/components/TaxTipSettings.tsx` - Added isLegacyFee detection, renders legacy fees as read-only

## Decisions Made
- **Synthetic ID prefix:** Used "legacy-" prefix for synthetic fee IDs to easily distinguish from real Convex IDs
- **Read-only enforcement:** Legacy fees shown as read-only even for hosts to prevent mutation failures

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 21 gap closure complete
- Legacy sessions now fully compatible with new multiple fees/taxes feature
- Ready to proceed to Phase 22 (Handwritten Tip Detection)

---
*Phase: 21-multiple-fees-taxes*
*Completed: 2026-01-19*

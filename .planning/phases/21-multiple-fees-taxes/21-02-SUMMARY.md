---
phase: 21-multiple-fees-taxes
plan: 02
subsystem: api, ui
tags: [convex, ocr, claude-vision, structured-outputs, react, fees, taxes]

# Dependency graph
requires:
  - phase: 21-01
    provides: Fees table with CRUD operations and getTotals multi-fee distribution
provides:
  - Multi-fee extraction from receipt OCR with exact labels
  - TaxTipSettings UI for viewing/editing multiple fees
  - Summary breakdown showing "Taxes & Fees" label
affects: [future-ocr-improvements, receipt-processing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fee list UI with local edit state per row"
    - "Sync on blur pattern for multi-row editing"

key-files:
  created: []
  modified:
    - convex/actions/parseReceipt.ts
    - src/components/TaxTipSettings.tsx
    - src/components/Summary.tsx
    - src/pages/Session.tsx

key-decisions:
  - "Extract gratuity both in fees array AND gratuity field from OCR"
  - "Auto-focus newly added fee label input for immediate editing"

patterns-established:
  - "Fee list editing: Map<feeId, FeeEditState> for independent row state"

# Metrics
duration: 9min
completed: 2026-01-17
---

# Phase 21 Plan 02: OCR and UI Updates Summary

**Multi-fee extraction from receipt OCR with exact labels, editable fee list in TaxTipSettings, and "Taxes & Fees" label throughout UI**

## Performance

- **Duration:** 9 min 2 sec
- **Started:** 2026-01-17T22:23:59Z
- **Completed:** 2026-01-17T22:33:01Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Updated parseReceipt prompt and schema to extract multiple fees with exact receipt labels
- Rewrote TaxTipSettings to display/edit fee list with add, remove, and inline editing
- Updated Summary breakdown to show "Taxes & Fees" instead of "Tax"
- Session.tsx now queries fees table and passes to TaxTipSettings

## Task Commits

Each task was committed atomically:

1. **Task 1: Update parseReceipt to extract multiple fees** - `2a4eeae` (feat)
2. **Task 2: Update TaxTipSettings for multiple fees** - `523c641` (feat)
3. **Task 3: Update Summary breakdown labels** - `920edba` (feat)

## Files Created/Modified

- `convex/actions/parseReceipt.ts` - Updated prompt, JSON schema, and types for fees array
- `src/components/TaxTipSettings.tsx` - Rewrote for fee list editing with add/remove/edit
- `src/components/Summary.tsx` - Changed "Tax" label to "Taxes & Fees"
- `src/pages/Session.tsx` - Added fees query and fees.addBulk for OCR results

## Decisions Made

1. **Extract gratuity in both places** - When OCR detects gratuity line, extract it both into fees array (for display) AND into gratuity field (for separate handling) since gratuity has special distribution logic
2. **Auto-focus new fee label** - When host clicks "Add fee", automatically focus and select the label input for immediate editing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full end-to-end flow working: receipt scan extracts multiple fees with exact labels
- Host can view, edit, add, and remove individual fees
- Summary shows "Taxes & Fees" breakdown correctly
- Existing sessions with single tax field continue working via dual-read fallback

---
*Phase: 21-multiple-fees-taxes*
*Completed: 2026-01-17*

---
phase: 10-feature-enhancements
plan: 01
subsystem: api
tags: [ocr, gratuity, convex, receipt-parsing]

# Dependency graph
requires:
  - phase: 02-receipt-processing
    provides: OCR receipt parsing with Claude Vision
  - phase: 06-calculation-engine
    provides: Tax/tip calculation infrastructure
provides:
  - Auto-gratuity extraction from receipt OCR
  - Gratuity field in session schema
  - Gratuity display in TaxTipSettings
  - Gratuity distribution in per-participant totals
affects: [summary, calculations, future-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Gratuity distributed proportionally like tax"
    - "OCR prompt extended for additional field extraction"

key-files:
  created: []
  modified:
    - convex/actions/parseReceipt.ts
    - convex/schema.ts
    - convex/sessions.ts
    - convex/participants.ts
    - src/pages/Session.tsx
    - src/components/TaxTipSettings.tsx
    - src/components/Summary.tsx

key-decisions:
  - "Gratuity stored in cents like other money fields"
  - "Auto-gratuity section always visible (even at $0) for transparency"
  - "Gratuity distributed proportionally by subtotal share"

patterns-established:
  - "Additional receipt fields extracted via OCR prompt extension"

# Metrics
duration: 4min
completed: 2026-01-15
---

# Phase 10 Plan 01: Auto-Gratuity Detection Summary

**Auto-gratuity extraction from OCR receipts with proportional distribution and always-visible display in Tax & Tip settings**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-15T05:47:45Z
- **Completed:** 2026-01-15T05:52:05Z
- **Tasks:** 4
- **Files modified:** 7

## Accomplishments

- Extended OCR prompt to detect auto-gratuity, service charges, and tip-included amounts
- Added gratuity field to session schema with updateGratuity mutation
- Integrated gratuity saving from OCR results in Session.tsx
- Created always-visible Auto-Gratuity section in TaxTipSettings (between Tax and Tip)
- Updated Group Total to include gratuity in breakdown
- Extended getTotals query to distribute gratuity proportionally per participant
- Added gratuity display in Summary breakdown row

## Task Commits

Each task was committed atomically:

1. **Task 1: Add gratuity extraction to OCR prompt and types** - `43c4f59` (feat)
2. **Task 2: Add gratuity field to session schema and mutations** - `5d5faa4` (feat)
3. **Task 3: Pass gratuity from OCR result to session** - `f9ceede` (feat)
4. **Task 4: Display auto-gratuity in TaxTipSettings** - `fc044a6` (feat)

## Files Created/Modified

- `convex/actions/parseReceipt.ts` - Added gratuity to OCR prompt and ParsedReceipt type
- `convex/schema.ts` - Added gratuity field to sessions table
- `convex/sessions.ts` - Added updateGratuity mutation
- `convex/participants.ts` - Added gratuity calculation and distribution in getTotals
- `src/pages/Session.tsx` - Pass OCR-detected gratuity to session
- `src/components/TaxTipSettings.tsx` - Display and edit auto-gratuity section
- `src/components/Summary.tsx` - Show gratuity in participant breakdown

## Decisions Made

- **Gratuity stored in cents** - Consistent with all other money fields in the app
- **Always-visible gratuity section** - Shows $0.00 by default for transparency, "(from receipt)" label when detected
- **Proportional distribution** - Gratuity distributed by subtotal share using same distributeWithRemainder helper as tax
- **Gratuity added after tip calculation** - Tip is calculated on subtotal/subtotal+tax, gratuity is flat addition to final total

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Auto-gratuity detection and display complete
- Ready for next plan in Phase 10

---
*Phase: 10-feature-enhancements*
*Completed: 2026-01-15*

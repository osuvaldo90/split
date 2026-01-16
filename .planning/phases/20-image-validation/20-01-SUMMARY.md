---
phase: 20-image-validation
plan: 01
subsystem: api
tags: [claude-vision, structured-outputs, validation, anthropic-sdk]

# Dependency graph
requires:
  - phase: 10-receipt-scanning
    provides: parseReceipt action foundation
provides:
  - receipt validation with is_receipt boolean
  - rejection_reason classification for non-receipts
  - user-friendly error messages with recovery hints
  - structured outputs beta integration
affects: [future-receipt-features, error-handling-patterns]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - structured-outputs-beta pattern for guaranteed JSON responses
    - discriminated-union response types for validation + extraction
    - rejection-message-mapping pattern for user-friendly errors

key-files:
  created: []
  modified:
    - convex/actions/parseReceipt.ts
    - src/pages/Session.tsx

key-decisions:
  - "Combined validation + extraction in single API call (avoid double latency/cost)"
  - "0.7 confidence threshold for receipt acceptance"
  - "Five rejection reasons: landscape_photo, screenshot, document, blurry, other"

patterns-established:
  - "Discriminated union for API responses with is_receipt boolean"
  - "Structured outputs beta: anthropic.beta.messages.create() with output_format"
  - "Error message format: title + hint separated by double newline"

# Metrics
duration: 8min
completed: 2026-01-16
---

# Phase 20 Plan 01: Image Validation Summary

**Receipt validation using Claude Vision structured outputs with discriminated union response and user-friendly rejection messages**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-16T21:02:00Z
- **Completed:** 2026-01-16T21:10:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added receipt validation to parseReceipt action with is_receipt boolean and confidence score
- Integrated structured outputs beta for guaranteed valid JSON responses
- Created user-friendly error messages mapping for 5 rejection reasons
- Updated Session.tsx error display with title + hint formatting

## Task Commits

Each task was committed atomically:

1. **Task 1: Add validation to parseReceipt with structured outputs** - `5c05963` (feat)
2. **Task 2: Map rejection reasons to user-friendly error messages** - `cb68f54` (feat)

## Files Created/Modified
- `convex/actions/parseReceipt.ts` - Added RECEIPT_VALIDATION_PROMPT, JSON schema for structured outputs, validation logic with confidence threshold
- `src/pages/Session.tsx` - Added REJECTION_MESSAGES mapping, updated error handling to detect rejection_reason, improved error display

## Decisions Made
- Combined validation + extraction in single API call to avoid double latency and cost
- Set confidence threshold at 0.7 based on research recommendations (can be tuned with production data)
- Used five rejection reasons that map to actionable user guidance (landscape_photo, screenshot, document, blurry, other)
- Error message format uses double newline separator to enable title/hint split in UI

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Image validation complete and ready for production use
- Valid receipts continue to extract items as before (no regression)
- Non-receipt images now show helpful messages with retry guidance
- Confidence threshold can be tuned in future based on production data

---
*Phase: 20-image-validation*
*Completed: 2026-01-16*

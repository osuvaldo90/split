---
phase: 14-access-control
plan: 01
subsystem: frontend
tags: [react, authorization, route-protection, ui]

# Dependency graph
requires:
  - phase: 12-security-hardening
    provides: Participant authorization on mutations
provides:
  - Route-level protection for /bill/:code route
  - JoinGate component for non-participants
  - Non-participants cannot view bill content until joining
affects: [security, ux, access-control]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Route-level gating based on participant status
    - Immediate state update after join (justJoinedParticipantId)

key-files:
  created:
    - src/components/JoinGate.tsx
  modified:
    - src/pages/Session.tsx
    - src/components/ClaimableItem.tsx
    - src/components/InlineItem.tsx
    - src/components/ReceiptReview.tsx

key-decisions:
  - "Show join gate after session loads but before content renders"
  - "Use local state for immediate UI update after joining (no page refresh needed)"
  - "Display host name on join gate for context"

patterns-established:
  - "Route-level participant gate: check effectiveStoredParticipantId and currentParticipant"

# Metrics
duration: 3min
completed: 2026-01-15
---

# Phase 14 Plan 01: Route Protection with Join Prompt Summary

**JoinGate component gates Session.tsx so non-participants see join prompt instead of bill content, with immediate content reveal after joining.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-15T21:32:06Z
- **Completed:** 2026-01-15T21:35:15Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created JoinGate component with name input, join button, loading/error states
- Pre-fills name from localStorage via getLastUsedName
- On join: stores participant, saves name preference, adds to bill history
- Modified Session.tsx to show JoinGate when user isn't a participant
- Non-participants cannot see items, claims, or participant details
- Immediate content reveal after joining (no page refresh needed)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create JoinGate component** - `e8a5626` (feat)
2. **Task 2: Gate Session.tsx behind JoinGate** - `b0504a7` (feat)

## Files Created/Modified

- `src/components/JoinGate.tsx` - New component: join prompt UI for non-participants
- `src/pages/Session.tsx` - Added JoinGate conditional render, justJoinedParticipantId state
- `src/components/ClaimableItem.tsx` - Fixed: pass participantId to updateItem
- `src/components/InlineItem.tsx` - Fixed: pass participantId to updateItem
- `src/components/ReceiptReview.tsx` - Fixed: pass participantId to updateTotals

## Decisions Made

1. **Gate placement** - JoinGate check placed after session null checks, before main content render
2. **Host name display** - Show "Hosted by [name]" on join gate for user context
3. **Immediate update** - Use justJoinedParticipantId state to immediately show content after joining

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed missing participantId in mutation calls**

- **Found during:** Task 1 verification (npm run build)
- **Issue:** Multiple mutations (updateItem, updateTotals) required participantId for authorization but frontend wasn't passing it
- **Fix:** Added participantId to mutation calls in ClaimableItem, InlineItem, ReceiptReview, Session
- **Files modified:** src/components/ClaimableItem.tsx, src/components/InlineItem.tsx, src/components/ReceiptReview.tsx, src/pages/Session.tsx
- **Commit:** `d3f3a21`

---

**Total deviations:** 1 auto-fixed (blocking issue)
**Impact on plan:** Pre-existing API contract changes needed frontend updates. Separate commit for fix.

## Issues Encountered

None - plan executed as specified with one blocking issue auto-fixed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Route protection complete: non-participants see join prompt, not bill content
- JoinGate reuses existing join flow patterns from Home.tsx
- Ready for Plan 14-02 (Mutation Authorization) to enforce server-side checks

---
*Phase: 14-access-control*
*Completed: 2026-01-15*

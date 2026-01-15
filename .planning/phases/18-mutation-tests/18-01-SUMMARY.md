---
phase: 18-mutation-tests
plan: 01
subsystem: testing
tags: [vitest, convex-test, mutations, unit-tests, validation]

# Dependency graph
requires:
  - phase: 15-test-infrastructure
    provides: Vitest and convex-test configured
  - phase: 16-authorization-tests
    provides: Test patterns and convex-test configuration
provides:
  - Session creation mutation tests (code generation, host participant)
  - Participant join mutation tests (sessionId, isHost, name validation)
  - Duplicate name handling tests (exact match, case-insensitive)
  - Claim idempotency tests (same ID returned, single DB record)
  - Item removal cascade tests (item and claims deleted)
  - Input validation tests (name, money, tip percent)
  - Full coverage of BTEST-16 through BTEST-23 requirements
affects: [19-e2e-tests]

# Tech tracking
tech-stack:
  added: []
  patterns: [mutation logic testing with convex-test, validation boundary testing]

key-files:
  created:
    - convex/mutations.test.ts
  modified: []

key-decisions:
  - "Test mutations through actual mutation calls, not direct validation function tests"
  - "Include boundary tests for validation limits (100 chars, $100k, 100%)"

patterns-established:
  - "Each test explicitly references BTEST requirement in test name"
  - "Validation tests check both rejection and acceptance at boundaries"
  - "Idempotency tests verify both return value and database state"

# Metrics
duration: 2min
completed: 2026-01-15
---

# Phase 18 Plan 01: Mutation Tests Summary

**39 mutation and validation tests covering session creation, participant join, duplicate names, claim idempotency, cascade deletion, and input validation using convex-test**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-15T23:39:38Z
- **Completed:** 2026-01-15T23:41:56Z
- **Tasks:** 3
- **Files created:** 1

## Accomplishments

- 10 session/participant tests (BTEST-16, BTEST-17, BTEST-18)
- 6 claim/cascade tests (BTEST-19, BTEST-20)
- 23 input validation tests (BTEST-21, BTEST-22, BTEST-23)
- Full coverage of all 8 BTEST requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Session and participant mutation tests** - `dd9cc6d` (test)
2. **Task 2: Claim and item cascade tests** - `e163426` (test)
3. **Task 3: Input validation tests** - `e941c6b` (test)

## Files Created/Modified

- `convex/mutations.test.ts` - 831 lines, comprehensive mutation tests

## BTEST Coverage

| Requirement | Description | Tests |
|-------------|-------------|-------|
| BTEST-16 | Session creation generates valid code, creates host | 3 |
| BTEST-17 | Join creates participant with correct properties | 3 |
| BTEST-18 | Duplicate names rejected (exact, case-insensitive) | 4 |
| BTEST-19 | Claim idempotency (same ID, single record) | 3 |
| BTEST-20 | Item removal cascades to delete claims | 3 |
| BTEST-21 | Name validation (empty, whitespace, length) | 7 |
| BTEST-22 | Money validation (negative, non-integer, limits) | 8 |
| BTEST-23 | Tip percent validation (negative, over 100%, valid) | 8 |

## Test Details

### Session Creation (BTEST-16)
- Generates 6-character codes with valid alphabet (no 0/O, 1/I/L)
- Creates host participant with isHost=true and correct name
- Trims whitespace from host name

### Participant Join (BTEST-17)
- Creates participant with correct sessionId and isHost=false
- Trims and validates name
- Rejects joining non-existent session

### Duplicate Name Handling (BTEST-18)
- Rejects exact duplicate name in same session
- Rejects case-insensitive duplicate (John vs john vs JOHN)
- Allows different names in same session
- Allows same name in different sessions

### Claim Idempotency (BTEST-19)
- Returns same claim ID when claiming twice
- Only creates one claim record after double-claim
- Properly creates claim on first call with correct properties

### Item Removal Cascade (BTEST-20)
- Deletes item when host removes it
- Deletes all associated claims when item is removed
- Works correctly even with no existing claims

### Input Validation (BTEST-21, BTEST-22, BTEST-23)
- Name: Empty, whitespace-only, over 100 chars rejected; 100 chars accepted
- Money: Negative, non-integer, Infinity, NaN, over $100k rejected; boundary accepted
- Tip: Negative, over 100%, Infinity, NaN rejected; 0%, 15%, 20%, 100% accepted

## Decisions Made

- **Test through mutations:** Test validation via actual mutation calls rather than direct function calls, ensuring end-to-end validation works correctly.
- **Boundary testing:** Include tests at exact boundaries (100 chars, $100,000, 100%) to verify off-by-one errors caught.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Mutation test foundation complete
- All 8 BTEST requirements (16-23) fully covered
- 39 tests providing confidence for mutation logic
- Combined test count now at 131 tests

---
*Phase: 18-mutation-tests*
*Completed: 2026-01-15*

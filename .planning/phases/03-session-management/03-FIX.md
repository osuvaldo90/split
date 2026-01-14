---
phase: 03-session-management
plan: 03-FIX
type: fix
wave: 1
depends_on: []
files_modified: [src/pages/Join.tsx]
autonomous: true
---

<objective>
Fix 1 UAT issue from phase 3.

Source: 03-UAT.md
Diagnosed: yes - error display passes raw Convex error message instead of user-friendly text
Priority: 0 blocker, 0 major, 1 minor, 0 cosmetic
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Issues being fixed:**
@.planning/phases/03-session-management/03-UAT.md

**Original plans for reference:**
@.planning/phases/03-session-management/03-03-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Fix UAT-001: Duplicate name error shows raw Convex error</name>
  <files>src/pages/Join.tsx</files>
  <action>
**Root Cause:** In handleJoin catch block (line 54-57), the error message is displayed directly via `err.message`. Convex wraps errors with metadata like `[CONVEX M(participants:join)] [Request ID: ...] Server Error Uncaught Error: {actual message}`.

**Issue:** "Error message is not user friendly - shows raw Convex error: [CONVEX M(participants:join)] [Request ID: ...] Server Error Uncaught Error: Name already taken in this session"

**Expected:** Show "Name already taken in this session" or similar user-friendly message.

**Fix:** Parse Convex error messages to extract the human-readable portion. Pattern:
1. Check if error message contains "Uncaught Error: "
2. If yes, extract just the part after "Uncaught Error: "
3. If no, use the full message as fallback

Update the catch block to clean up error messages before displaying.
  </action>
  <verify>
- Open /join, enter valid session code, enter a name already used in the session
- Error message should show "Name already taken in this session" (not the raw Convex error)
  </verify>
  <done>UAT-001 resolved - duplicate name error shows user-friendly message</done>
</task>

</tasks>

<verification>
Before declaring plan complete:
- [x] All blocker issues fixed (none)
- [x] All major issues fixed (none)
- [ ] Minor/cosmetic issues fixed or documented as deferred
- [ ] Each fix verified against original reported issue
</verification>

<success_criteria>
- All UAT issues from 03-UAT.md addressed
- Tests pass
- Ready for re-verification with /gsd:verify-work 3
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-FIX-SUMMARY.md`
</output>

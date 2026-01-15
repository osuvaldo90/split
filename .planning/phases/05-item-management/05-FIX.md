---
phase: 05-item-management
plan: 05-FIX
type: fix
wave: 1
depends_on: []
files_modified: [src/app/create/page.tsx]
autonomous: true
---

<objective>
Fix 1 UAT issue from phase 05.

Source: 05-UAT.md
Diagnosed: yes
Priority: 1 blocker, 0 major, 0 minor, 0 cosmetic
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Issues being fixed:**
@.planning/phases/05-item-management/05-UAT.md

**Original plans for reference:**
@.planning/phases/05-item-management/05-01-PLAN.md
@.planning/phases/05-item-management/05-02-PLAN.md

**Session persistence implementation (for storeParticipant pattern):**
@.planning/phases/04-real-time-sync/04-01-SUMMARY.md
</context>

<tasks>
<task type="auto">
  <name>Fix UAT-001: Host shows "Join to claim items" despite being in session</name>
  <files>src/app/create/page.tsx</files>
  <action>
**Root Cause:** Host's participantId not stored in localStorage after session creation. storeParticipant() never called for host.

**Issue:** "no. it says 'join to claim item'" - Host cannot claim items after creating a session because their participantId is not stored in localStorage. The session page checks localStorage for participantId to determine if user can claim, but the create flow never stores it.

**Expected:** After creating a session, host should be able to tap items to claim them immediately.

**Fix:**
1. In src/app/create/page.tsx, after successful session creation (after getting the session from createSession mutation), call storeParticipant() with the session code and the host's participantId
2. Import storeParticipant from @/lib/session-storage (same pattern used in join flow)
3. The host's participantId is available from the createSession mutation result

**Reference pattern:** The join flow in join/[code]/page.tsx calls storeParticipant after joinSession - apply same pattern to create flow.
  </action>
  <verify>
- Create a new session as host
- Check localStorage has participantId stored for session code
- Tap an item - claim should work (no "Join to claim" message)
  </verify>
  <done>UAT-001 resolved - host's participantId stored in localStorage after session creation, enabling claiming</done>
</task>
</tasks>

<verification>
Before declaring plan complete:
- [ ] Host's participantId stored in localStorage after creating session
- [ ] Host can claim items immediately after session creation
- [ ] No regression in join flow (non-host can still claim)
- [ ] Build passes
</verification>

<success_criteria>
- All UAT issues from 05-UAT.md addressed
- Tests pass
- Ready for re-verification with /gsd:verify-work 5
</success_criteria>

<output>
After completion, create `.planning/phases/05-item-management/05-FIX-SUMMARY.md`
</output>

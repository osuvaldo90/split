---
phase: 09-ui-ux-improvements
plan: 09-FIX
type: fix
wave: 1
depends_on: []
files_modified: [src/components/ReceiptCapture.tsx, src/components/InlineItem.tsx]
autonomous: true
---

<objective>
Fix 2 UAT issues from phase 9.

Source: 09-UAT.md
Diagnosed: yes
Priority: 1 major, 1 cosmetic
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md

**Issues being fixed:**
@.planning/phases/09-ui-ux-improvements/09-UAT.md

**Original plan for reference:**
@.planning/phases/09-ui-ux-improvements/09-01-PLAN.md

**Source files:**
@src/components/ReceiptCapture.tsx
@src/components/InlineItem.tsx
</context>

<tasks>
<task type="auto">
  <name>Task 1: Fix UAT-001 - Android camera option</name>
  <files>src/components/ReceiptCapture.tsx</files>
  <action>
**Root Cause:** Using `accept="image/*"` alone doesn't trigger camera option on Android. Need `capture="environment"` attribute on the file input, OR provide separate camera button. iOS handles this automatically but Android requires explicit capture attribute.

**Issue:** "on android the 'add receipt' button only shows a photo picker and doesn't give me an option to use the camera."

**Expected:** Single "Add Receipt" button that offers both gallery and camera options on all platforms.

**Fix:** The simplest cross-platform solution is to add TWO file inputs:
1. One with `capture="environment"` for camera (shows camera directly)
2. One with just `accept="image/*"` for gallery

Then provide TWO buttons: "Take Photo" and "Choose from Gallery". This is more explicit than trying to get the OS picker to behave consistently. While it's technically 2 buttons, it gives users clear control and works on all platforms.

Alternative: Keep single button but use `capture="environment"` which will open camera on Android. However, this removes gallery option. Better to be explicit with 2 buttons for clear UX.
  </action>
  <verify>
- On Android: Both "Take Photo" (opens camera) and "Choose Image" (opens gallery) buttons work
- On iOS: Both buttons work (camera and photo library)
- Uploading from either source works correctly
  </verify>
  <done>UAT-001 resolved - Android users can access camera via explicit "Take Photo" button</done>
</task>

<task type="auto">
  <name>Task 2: Fix UAT-002 - Edit layout alignment</name>
  <files>src/components/InlineItem.tsx</files>
  <action>
**Root Cause:** Row 2 layout has inconsistent spacing - price input uses flex-1 spacer pushing delete far right, $ prefix and input not visually grouped, overall alignment feels unbalanced. Need to constrain row width or better align the price/delete elements.

**Issue:** "yes, but it looks wonky and i think it could have a cleaner, better aligned ui"

**Expected:** Edit mode has clean, well-aligned layout that doesn't feel "wonky".

**Fix:** Improve Row 2 layout:
1. Group $ prefix more tightly with price input (use border styling to make them feel connected)
2. Remove flex-1 spacer - instead use justify-between on the row to naturally space elements
3. Consider making delete button same visual treatment as price group (border, grouped feel)
4. Ensure consistent visual rhythm between elements

Specific changes to Row 2:
- Use `justify-between` on the row container
- Group $ and price input in a styled container (e.g., border around the group, $ inside the input area visually)
- Keep delete button right-aligned but remove arbitrary spacer
  </action>
  <verify>
- Edit mode layout looks clean and aligned
- $ prefix and price input feel visually connected
- Delete button is clearly positioned (right side) without awkward spacing
- Layout works well at different screen widths
  </verify>
  <done>UAT-002 resolved - Edit layout has cleaner, better-aligned UI</done>
</task>
</tasks>

<verification>
Before declaring plan complete:
- [ ] Android camera option works (UAT-001)
- [ ] iOS still works for both camera and gallery
- [ ] Edit layout looks cleaner and aligned (UAT-002)
- [ ] No regressions in upload or edit functionality
- [ ] Build passes with no TypeScript errors
</verification>

<success_criteria>
- All UAT issues from 09-UAT.md addressed
- Tests pass
- Ready for re-verification with /gsd:verify-work 9
</success_criteria>

<output>
After completion, create `.planning/phases/09-ui-ux-improvements/09-FIX-SUMMARY.md`
</output>

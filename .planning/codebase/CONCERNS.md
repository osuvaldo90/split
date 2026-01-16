# Codebase Concerns

**Analysis Date:** 2026-01-16

## Tech Debt

**Large Component Files:**
- Issue: Several components exceed 300 lines, making them harder to maintain and test
- Files: `src/pages/Session.tsx` (517 lines), `src/components/ClaimableItem.tsx` (367 lines), `src/components/TaxTipSettings.tsx` (360 lines)
- Impact: Higher cognitive load when making changes, harder to isolate bugs
- Fix approach: Extract sub-components (e.g., SessionHeader, ItemsList, ReceiptUploader from Session.tsx)

**Unused Function Parameter:**
- Issue: Parameter passed to component but explicitly ignored with eslint-disable
- Files: `src/components/ClaimableItem.tsx` (lines 40-41)
- Impact: Dead code, confusing interface
- Fix approach: Remove `onDraftChange` prop from `ClaimableItemProps` interface if not needed

**No Session Expiration:**
- Issue: Sessions persist indefinitely in database with no cleanup mechanism
- Files: `convex/schema.ts` (sessions table), `convex/sessions.ts`
- Impact: Database bloat over time, potential for stale session codes to conflict
- Fix approach: Add `expiresAt` field and scheduled function to delete old sessions (e.g., after 24 hours)

**No Rate Limiting on Mutations:**
- Issue: Mutations lack rate limiting - users can spam requests
- Files: `convex/sessions.ts`, `convex/items.ts`, `convex/claims.ts`, `convex/participants.ts`
- Impact: Potential for abuse, excessive API calls to external services (Claude Vision)
- Fix approach: Add rate limiting middleware or track request counts per session/IP

## Known Bugs

**No known bugs identified**

The codebase appears to be well-tested with comprehensive unit tests for calculations (`convex/calculations.test.ts`), mutations (`convex/mutations.test.ts`), and E2E tests for user flows.

## Security Considerations

**Participant Authorization via Client-Side Storage:**
- Risk: Participant identity is stored in localStorage and passed to mutations as `participantId`. A malicious user could forge a participant ID.
- Files: `src/lib/sessionStorage.ts`, `src/pages/Session.tsx` (line 53), `convex/claims.ts`, `convex/items.ts`
- Current mitigation: Backend validates participant exists and belongs to session before allowing operations
- Recommendations: Consider server-side session tokens or authentication. Current model is acceptable for casual bill-splitting but not for high-security use cases.

**Receipt Upload Has No Authorization:**
- Risk: `generateUploadUrl` mutation has no authorization check - anyone can generate upload URLs
- Files: `convex/receipts.ts` (lines 5-10)
- Current mitigation: None - upload URLs are short-lived
- Recommendations: Require participant ID parameter and verify participant exists

**Session Codes are Guessable:**
- Risk: 6-character alphanumeric codes have limited entropy (~1.5 billion combinations). Brute force could find active sessions.
- Files: `convex/sessions.ts` (lines 6-13)
- Current mitigation: None
- Recommendations: For a casual bill-splitting app, this is acceptable. For higher security, add request throttling or increase code length.

**API Key Exposure:**
- Risk: ANTHROPIC_API_KEY is accessed via environment variable but would be exposed if logging is misconfigured
- Files: `convex/actions/parseReceipt.ts` (line 80)
- Current mitigation: Stored in `.env.local` which is gitignored
- Recommendations: Ensure production keys are stored in Convex environment variables dashboard, not in code

## Performance Bottlenecks

**N+1 Query Pattern in Item Deletion:**
- Problem: When deleting items via `remove` or `addBulk`, claims are fetched and deleted one-by-one in a loop
- Files: `convex/items.ts` (lines 121-129, 178-190)
- Cause: Sequential database operations within a mutation
- Improvement path: Use batch delete if Convex supports it, or accept current behavior for typical small bill sizes (<50 items)

**Full Data Fetch on Every Participant View:**
- Problem: `getTotals` query fetches all participants, items, and claims for a session on every call
- Files: `convex/participants.ts` (lines 129-308)
- Cause: Real-time reactivity requires full data to recalculate splits
- Improvement path: This is acceptable for typical use (5-10 participants, 20-50 items). Consider caching or pagination only if session sizes grow significantly.

**Client-Side Calculation Duplication:**
- Problem: `TaxTipSettings.tsx` imports and calls `calculateTipShare` directly, duplicating logic that also runs server-side
- Files: `src/components/TaxTipSettings.tsx` (lines 5, 80-87)
- Cause: Need for instant preview before server roundtrip
- Improvement path: Acceptable trade-off for UX. Ensure calculation logic stays in sync.

## Fragile Areas

**Session Restoration Logic:**
- Files: `src/pages/Session.tsx` (lines 34-59, 235-237), `src/pages/Home.tsx` (lines 42-84)
- Why fragile: Complex state machine involving localStorage, multiple useQuery results, and null checks to determine if user needs to join
- Safe modification: Add comprehensive E2E tests before changing. Current flow: check localStorage -> validate participant exists -> verify participant belongs to current session
- Test coverage: E2E tests cover happy path but edge cases (stale participant, different session) may need more coverage

**Tip Calculation with Multiple Types:**
- Files: `convex/calculations.ts` (lines 56-84), `convex/participants.ts` (lines 250-266)
- Why fragile: Three tip types (percent_subtotal, percent_total, manual) with different calculation methods and rounding
- Safe modification: Run `convex/calculations.test.ts` after any changes. Tests cover edge cases like zero values and rounding.
- Test coverage: Good coverage via unit tests

**Draft Item State Management:**
- Files: `src/pages/Session.tsx` (lines 87-91, 434-452), `src/components/ClaimableItem.tsx`
- Why fragile: Draft items are local-only state rendered alongside real items. Mixing local and remote state can cause sync issues.
- Safe modification: Ensure draft is cleared on save/cancel before navigation
- Test coverage: No specific tests for draft item edge cases

## Scaling Limits

**Participants per Session:**
- Current capacity: Untested, likely works well for 5-20 participants
- Limit: UI may become cramped, `getTotals` query will slow with 50+ participants
- Scaling path: Add pagination to participant list, optimize `getTotals` to stream results

**Items per Receipt:**
- Current capacity: Limited to 500 items per `addBulk` call
- Limit: Enforced in `convex/items.ts` (line 148)
- Scaling path: Current limit is reasonable for restaurant receipts

**Concurrent Sessions:**
- Current capacity: Limited by Convex backend capacity
- Limit: Convex handles scaling automatically
- Scaling path: No immediate concerns

## Dependencies at Risk

**No high-risk dependencies identified**

All dependencies are well-maintained:
- `convex`: Active development, official Convex SDK
- `@anthropic-ai/sdk`: Official Anthropic SDK
- `react`, `react-router-dom`: Stable, widely used
- `tailwindcss`: Active development, v4 is new but stable

## Missing Critical Features

**No Session Cleanup:**
- Problem: Old sessions accumulate forever
- Blocks: Long-term database storage costs and potential code collisions

**No Participant Removal:**
- Problem: No way for host to remove a participant who joined with wrong name or left
- Blocks: Cleaning up after mistakes

**No Offline Support:**
- Problem: App requires constant internet connection
- Blocks: Use in areas with poor connectivity (restaurants with weak wifi)

## Test Coverage Gaps

**Frontend Components:**
- What's not tested: React components lack unit tests
- Files: All files in `src/components/`, `src/pages/`
- Risk: UI bugs may go unnoticed, especially edge cases in form validation
- Priority: Medium - E2E tests cover main flows but not component-level edge cases

**Error Handling Paths:**
- What's not tested: Catch blocks in localStorage operations silently fail
- Files: `src/lib/sessionStorage.ts`, `src/lib/billHistory.ts`, `src/lib/userPreferences.ts`
- Risk: Users may not be informed of storage failures
- Priority: Low - graceful degradation is acceptable for non-critical features

**Receipt Parsing Edge Cases:**
- What's not tested: Various receipt formats, OCR failures, malformed JSON responses
- Files: `convex/actions/parseReceipt.ts`
- Risk: Users may encounter unhelpful error messages on unusual receipts
- Priority: Medium - OCR is inherently variable, but error messages could be more helpful

**Claim Authorization Edge Cases:**
- What's not tested: Race conditions where participant is deleted while claiming
- Files: `convex/claims.ts`
- Risk: Low - unlikely scenario, backend validation would catch it
- Priority: Low

---

*Concerns audit: 2026-01-16*

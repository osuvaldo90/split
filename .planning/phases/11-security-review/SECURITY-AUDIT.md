# Security Audit Report

**Generated:** 2026-01-15
**Phase:** 11-security-review
**Application:** Split - Bill Splitting App

---

## Authorization

This section reviews all Convex mutations for authorization gaps.

### sessions.ts

| Endpoint | Auth Checks | Risk | Notes |
|----------|-------------|------|-------|
| `create` | None needed | LOW | Creates new session - any user can start a bill |
| `updateTip` | **NONE** | MEDIUM | Any user with sessionId can modify tip settings |
| `updateTax` | **NONE** | MEDIUM | Any user with sessionId can modify tax |
| `updateTotals` | **NONE** | LOW | Called after OCR - any user can update totals |
| `updateGratuity` | **NONE** | MEDIUM | Any user with sessionId can modify gratuity |

**Findings:**
- `updateTip`, `updateTax`, `updateGratuity` have NO authorization checks
- Any user who knows a sessionId (obtainable from the 6-char code) can modify financial settings
- Currently, the UI restricts these to host (`isHost` check in `TaxTipSettings.tsx`), but the API is unprotected
- **Risk:** A malicious participant could bypass the UI and call these mutations directly

**Recommendation:**
- Add participantId parameter and verify isHost flag before allowing modifications
- Consider: Is this the intended design? Collaborative bill splitting may intentionally allow any participant to adjust settings

---

### participants.ts

| Endpoint | Auth Checks | Risk | Notes |
|----------|-------------|------|-------|
| `join` | Session exists, name uniqueness | LOW | Validates session exists and prevents duplicate names |
| `updateName` | **NONE** | HIGH | Any user can update ANY participant's name |

**Findings:**
- `updateName` takes only `participantId` - no verification that the caller owns this participant
- Attack: User A could change User B's name to something offensive
- The frontend stores participantId in localStorage, but this is easily spoofed

**Recommendation:**
- `updateName` should verify caller is the participant being updated OR is the host
- Consider adding a simple token/secret when participant joins that must be provided for updates

---

### items.ts

| Endpoint | Auth Checks | Risk | Notes |
|----------|-------------|------|-------|
| `add` | **NONE** | LOW | Any user can add items - collaborative by design |
| `update` | **NONE** | MEDIUM | Any user can modify ANY item's name/price |
| `remove` | **NONE** | MEDIUM | Any user can delete ANY item |
| `addBulk` | **NONE** | MEDIUM | Replaces ALL items - destructive operation |

**Findings:**
- All item mutations are completely open - no session or participant verification
- `addBulk` is particularly dangerous: it deletes ALL existing items and claims for a session
- Attack: Malicious user could wipe all items from a bill by calling `addBulk` with empty array
- Attack: User could change item prices to manipulate who pays what

**Recommendation:**
- At minimum, verify that the sessionId in the item matches a valid session
- Consider restricting destructive operations (`remove`, `addBulk`) to host only
- For `update`: Consider allowing anyone (collaborative editing) but log changes

---

### claims.ts

| Endpoint | Auth Checks | Risk | Notes |
|----------|-------------|------|-------|
| `claim` | Existing claim check (idempotent) | LOW | Can claim for any participantId |
| `unclaim` | **NONE** | MEDIUM | Any user can unclaim for ANY participant |
| `unclaimByHost` | Verifies hostParticipantId.isHost | LOW | Properly checks host status |

**Findings:**
- `claim` accepts any participantId - User A can claim items as User B
  - This may be intentional for collaborative claiming, but enables manipulation
- `unclaim` has NO authorization - User A can remove User B's claims
  - This is more problematic than claiming: removing someone's claim without consent
- `unclaimByHost` correctly verifies the caller is a host

**Critical Issue:**
```typescript
// claims.ts - unclaim mutation
export const unclaim = mutation({
  args: {
    itemId: v.id("items"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    // NO VERIFICATION that caller IS this participant
    const claim = await ctx.db
      .query("claims")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .filter((q) => q.eq(q.field("participantId"), args.participantId))
      .first();

    if (claim) {
      await ctx.db.delete(claim._id);
    }
  },
});
```

**Recommendation:**
- `unclaim` should verify that either:
  1. The caller's participantId matches args.participantId (unclaiming own item), OR
  2. The caller is the host (can manage others' claims)
- Consider adding a "currentParticipantId" parameter to verify identity

---

### receipts.ts

| Endpoint | Auth Checks | Risk | Notes |
|----------|-------------|------|-------|
| `generateUploadUrl` | **NONE** | MEDIUM | Anyone can generate upload URLs |
| `saveReceiptImage` | **NONE** | MEDIUM | Any user can overwrite session's receipt |

**Findings:**
- `generateUploadUrl` returns a Convex storage upload URL without any authentication
- While Convex storage URLs are time-limited, this allows anonymous uploads
- `saveReceiptImage` allows any user to replace a session's receipt image
- No file type or size validation at the API level (Convex storage may have limits)

**Recommendation:**
- Consider adding session/participant context to receipt operations
- Restrict `saveReceiptImage` to host or first uploader

---

### actions/parseReceipt.ts

| Endpoint | Auth Checks | Risk | Notes |
|----------|-------------|------|-------|
| `parseReceipt` | **NONE** | LOW | Any user can trigger OCR on any storage ID |

**Findings:**
- Takes a storageId and calls Claude API - no verification of ownership
- Could be used to incur API costs by parsing arbitrary images
- No rate limiting at the Convex level

**Recommendation:**
- Consider adding sessionId parameter and verifying the storageId belongs to that session
- Implement rate limiting (Convex-level or application-level)

---

### Summary: Authorization Issues

| Priority | Issue | Affected Endpoints |
|----------|-------|-------------------|
| HIGH | Any user can modify another user's name | `participants.updateName` |
| HIGH | Any user can unclaim another user's items | `claims.unclaim` |
| MEDIUM | Non-host can modify session settings | `sessions.updateTip/Tax/Gratuity` |
| MEDIUM | Any user can delete/modify any item | `items.update`, `items.remove` |
| MEDIUM | Any user can wipe all items | `items.addBulk` |
| LOW | Anonymous receipt upload | `receipts.generateUploadUrl` |
| LOW | Cross-session claim manipulation possible | `claims.claim` |

**Overall Authorization Assessment:**
The application relies heavily on client-side trust (localStorage participantId) without server-side verification. This is a common pattern in collaborative apps but creates security gaps. The most critical issues are:
1. `participants.updateName` - allows impersonation
2. `claims.unclaim` - allows claim manipulation
3. Session settings modifications without host verification

---

## Input Validation

This section reviews all user input points for validation completeness.

### Session Code Input

| Input | Convex Validation | Frontend Validation | Risk | Notes |
|-------|-------------------|---------------------|------|-------|
| Session code (6-char lookup) | `v.string()` only | `.toUpperCase().slice(0, 6)` | LOW | Limited character set mitigates risks |

**Findings:**
- Frontend enforces max 6 characters and uppercase conversion
- Backend `getByCode` normalizes with `.toUpperCase().trim()`
- Code generation uses limited charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes confusing chars)
- **Timing attack consideration:** Code lookup uses indexed query - consistent timing
- Code space: 32^6 = ~1 billion combinations - sufficient for enumeration resistance

**Recommendation:**
- Current implementation is adequate for the use case
- Consider rate limiting on `getByCode` to prevent brute-force enumeration

---

### Names (Host name, Participant name, Item name)

| Input | Convex Validation | Frontend Validation | Risk | Notes |
|-------|-------------------|---------------------|------|-------|
| Host name | `v.string()` | `autoCapitalize="words"` | MEDIUM | No length limit |
| Participant name | `v.string()` | `autoCapitalize="words"` | MEDIUM | No length limit |
| Item name | `v.string()` | None | MEDIUM | No length limit |

**Findings:**
- All names accept arbitrary strings with no length restrictions
- Backend applies `.trim()` but no sanitization
- **XSS Risk:** Names are rendered in React JSX which auto-escapes by default
  - `{participant.name}` is safe (React escapes HTML entities)
  - No `dangerouslySetInnerHTML` usage found
- **Storage/DoS Risk:** Extremely long names could cause storage issues
  - No max length at Convex level
  - A malicious user could submit multi-MB names

**Test for XSS protection:**
```javascript
// These would be rendered as text, not executed
hostName: "<script>alert('xss')</script>"
itemName: "Pizza <img src=x onerror=alert(1)>"
```

React's JSX escaping handles this correctly - verified by code inspection.

**Recommendation:**
- Add `v.string().maxLength(100)` validators for names in Convex schema
- Add frontend max length attributes to inputs
- Names should be limited to reasonable lengths (50-100 chars)

---

### Prices and Financial Values

| Input | Convex Validation | Frontend Validation | Risk | Notes |
|-------|-------------------|---------------------|------|-------|
| Item price | `v.number()` | `inputMode="decimal"`, regex filter | MEDIUM | No bounds checking |
| Tax | `v.number()` | `inputMode="decimal"`, regex filter | MEDIUM | No bounds checking |
| Gratuity | `v.number()` | `inputMode="decimal"`, regex filter | MEDIUM | No bounds checking |
| Tip value | `v.number()` | `inputMode="decimal"`, regex filter | MEDIUM | No bounds checking |

**Findings:**
- Prices stored in cents as integers - good practice, avoids floating point issues
- Frontend regex: `.replace(/[^0-9.]/g, "")` - strips non-numeric except decimal
- **Negative values:** `v.number()` accepts negative numbers
  - Negative prices could manipulate totals
  - Negative tax/tip could reduce others' shares
- **Huge values:** No upper bound validation
  - Could overflow calculations or cause UI issues
- **Precision issues:** Frontend uses `parseFloat()` then `Math.round()`
  - Adequate for typical currency values

**Backend code example (no bounds):**
```typescript
// items.ts - add mutation
args: {
  sessionId: v.id("sessions"),
  name: v.string(),
  price: v.number(), // No v.number().min(0) or max
  quantity: v.optional(v.number()),
},
```

**Recommendation:**
- Add `v.number().min(0)` for all price/tax/tip fields
- Add reasonable upper bounds: `v.number().max(10000000)` (max $100,000)
- Consider `v.number().int()` to enforce integer cents

---

### Quantity Values

| Input | Convex Validation | Frontend Validation | Risk | Notes |
|-------|-------------------|---------------------|------|-------|
| Item quantity | `v.optional(v.number())` | `min="1"` HTML attribute | LOW | Frontend restricted |

**Findings:**
- Frontend input has `min="1"` attribute
- Backend defaults to `args.quantity ?? 1`
- No max quantity validation
- **Zero/negative:** Could set quantity to 0 or negative via API

**Recommendation:**
- Add `v.number().int().min(1).max(100)` for quantity

---

### Receipt Image Upload

| Input | Convex Validation | Frontend Validation | Risk | Notes |
|-------|-------------------|---------------------|------|-------|
| Image file | None at mutation level | `accept="image/*"` | MEDIUM | Relies on Convex storage |

**Findings:**
- Frontend uses `accept="image/*"` to filter file picker
- No server-side file type validation in `generateUploadUrl` or `saveReceiptImage`
- Convex storage handles file uploads directly via generated URLs
- `parseReceipt` action casts blob type without validation:
```typescript
const mediaType = imageBlob.type as
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp";
```

**Risks:**
- Non-image files could be uploaded (storage accepts anything)
- Malicious files stored in Convex storage
- OCR action would fail gracefully if non-image passed to Claude API

**Recommendation:**
- Validate file type in `parseReceipt` before sending to Claude:
  ```typescript
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(imageBlob.type)) {
    throw new Error("Invalid file type - only images supported");
  }
  ```
- Consider adding file size limit check (Convex may have default limits)

---

### OCR Response Parsing

| Input | Validation | Risk | Notes |
|-------|------------|------|-------|
| Claude API JSON response | `JSON.parse()` with try/catch | LOW | Graceful error handling |

**Findings:**
- `parseReceipt` action properly wraps JSON parsing in try/catch
- Returns error object with raw response for debugging
- Strips markdown code fences before parsing
- **Type safety:** Response cast to `ParsedReceipt` type without runtime validation
  - Malformed response could have wrong types
  - Frontend handles this gracefully (OCR errors shown to user)

**Recommendation:**
- Consider adding runtime type validation (e.g., Zod schema) for Claude response
- Current implementation is acceptable - errors are contained

---

### Summary: Input Validation Issues

| Priority | Issue | Affected Inputs |
|----------|-------|-----------------|
| MEDIUM | No length limits on names | hostName, participantName, itemName |
| MEDIUM | No bounds on numeric values | price, tax, gratuity, tipValue |
| MEDIUM | Accepts negative numbers | All financial fields |
| LOW | No server-side image type validation | Receipt upload |
| LOW | Quantity accepts zero/negative | Item quantity |

**Overall Input Validation Assessment:**
The application uses Convex validators for type safety but lacks business logic constraints. The main concerns are:
1. Unbounded string lengths - potential for DoS or storage abuse
2. No numeric bounds - negative values could manipulate calculations
3. File upload validation is frontend-only

React's JSX escaping provides XSS protection for rendered values, which is a significant security benefit.

---

## Data Exposure

This section reviews all Convex queries for data exposure issues.

### sessions.ts Queries

| Query | Data Returned | Access Control | Risk | Notes |
|-------|---------------|----------------|------|-------|
| `getByCode` | Full session object | None - public lookup | LOW | Returns session for any valid code |
| `get` | Full session object | None - requires sessionId | LOW | Requires knowing the ID |

**Findings:**
- `getByCode` allows anyone to look up a session by 6-char code
- Returns all session data including `receiptImageId`, `hostName`, financial settings
- **Enumeration risk:** Code space is 32^6 (~1 billion) - practical to enumerate?
  - At 1000 queries/second, full enumeration takes ~32 years
  - Random discovery of active sessions is unlikely
  - **However:** No rate limiting means a determined attacker could find some sessions

**Code generation analysis:**
```typescript
// sessions.ts - generateCode()
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars
// 32^6 = 1,073,741,824 combinations
```

**Recommendation:**
- Consider rate limiting on `getByCode` (Convex doesn't have built-in rate limiting)
- Current entropy is adequate for casual use but not against targeted attacks
- Alternative: Use longer codes (8 chars = 32^8 = 1 trillion combinations)

---

### participants.ts Queries

| Query | Data Returned | Access Control | Risk | Notes |
|-------|---------------|----------------|------|-------|
| `listBySession` | All participants in session | None - requires sessionId | LOW | Returns names and host status |
| `getById` | Single participant | None - requires participantId | LOW | Used for session restoration |
| `getTotals` | Per-participant financial breakdown | None - requires sessionId | MEDIUM | Exposes detailed financial info |

**Findings:**

**`listBySession`:**
- Returns all participants with names, isHost flag, joinedAt timestamp
- Anyone with sessionId can see who's in the session
- No PII beyond names (no emails, phone numbers)

**`getById`:**
- Returns single participant data
- Used to verify localStorage participant still exists
- Participant IDs are UUIDs - not guessable

**`getTotals` - Detailed analysis:**
```typescript
// Returns for each participant:
return {
  participantId: participant._id,
  name: participant.name,
  isHost: participant.isHost,
  subtotal: data.subtotal,      // What they owe for items
  tax: tax,                     // Their tax share
  gratuity: gratuityShares[i],  // Their gratuity share
  tip: tipShares[i],            // Their tip share
  total: ...,                   // Grand total they owe
  claimedItems: data.claimedItems, // Items they claimed with prices
};
```

**Exposure concern:**
- Any user with sessionId can see what everyone owes
- This is likely INTENTIONAL for bill splitting transparency
- However, exposes financial details to non-participants who discover the code

**Recommendation:**
- Current design is appropriate for collaborative bill splitting
- Consider adding "private mode" option where only host sees totals
- Document that session codes should not be shared publicly

---

### items.ts Queries

| Query | Data Returned | Access Control | Risk | Notes |
|-------|---------------|----------------|------|-------|
| `listBySession` | All items in session | None - requires sessionId | LOW | Public within session |

**Findings:**
- Returns all items with names, prices, quantities
- No access control - intentional for collaborative editing
- Items don't contain sensitive data beyond receipt contents

**Recommendation:**
- No changes needed - items are meant to be visible to all participants

---

### claims.ts Queries

| Query | Data Returned | Access Control | Risk | Notes |
|-------|---------------|----------------|------|-------|
| `listBySession` | All claims in session | None - requires sessionId | LOW | Public within session |
| `getByItem` | Claims for specific item | None - requires itemId | LOW | Shows who claimed what |
| `getByParticipant` | Claims by participant | None - requires participantId | LOW | Shows what someone claimed |

**Findings:**
- All claim queries expose who claimed what items
- This is core functionality for bill splitting
- **Cross-reference risk:** `getByParticipant` with known participantId could reveal claims
  - Requires knowing the participantId (UUID, not guessable)
  - Low practical risk

**Recommendation:**
- No changes needed - claim visibility is core feature

---

### receipts.ts Queries

| Query | Data Returned | Access Control | Risk | Notes |
|-------|---------------|----------------|------|-------|
| `getReceiptUrl` | Convex storage URL | None - requires storageId | MEDIUM | Returns serving URL for any storageId |

**Findings:**

**Critical issue with `getReceiptUrl`:**
```typescript
export const getReceiptUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

**Problems:**
1. Takes any storageId - no verification it belongs to caller's session
2. Storage IDs are not secret but are meant to be scoped to sessions
3. If an attacker guesses/obtains a storageId, they can view ANY receipt image
4. Receipt images may contain sensitive info (merchant names, credit card last 4, etc.)

**Storage ID format:**
- Convex storage IDs are deterministic but not easily guessable
- Format: `kg2...` (base62-ish encoding)
- Sequential enumeration is not practical

**Practical risk assessment:**
- LOW probability: Attacker would need to obtain valid storageId
- MEDIUM impact: Receipt images could contain PII
- Combined: MEDIUM risk

**Recommendation:**
- Add sessionId parameter to `getReceiptUrl` and verify storageId matches session's `receiptImageId`
- Example fix:
```typescript
export const getReceiptUrl = query({
  args: {
    sessionId: v.id("sessions"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.receiptImageId !== args.storageId) {
      throw new Error("Receipt not found");
    }
    return await ctx.storage.getUrl(args.storageId);
  },
});
```

---

### Session Code Enumeration Analysis

**Detailed enumeration risk assessment:**

| Factor | Value | Impact |
|--------|-------|--------|
| Code space | 32^6 = ~1B | Large but finite |
| Active sessions at any time | ~10-1000? | Very small fraction |
| Code lifetime | Hours to days | Codes expire naturally |
| Rate limiting | None | Unlimited queries possible |

**Attack scenario:**
1. Attacker queries random codes continuously
2. With 1B possibilities and 1000 active sessions: 1 in 1M chance per query
3. At 100 queries/second: ~3 hours to find one session statistically
4. **Mitigation:** Sessions expire, so window of opportunity is limited

**Recommendation:**
- Add rate limiting on `getByCode` (e.g., 10 queries/minute per IP)
- Consider extending code length for high-value use cases
- Current design is acceptable for casual social bill splitting

---

### localStorage Trust Model

**Frontend data storage analysis:**

The app stores in localStorage:
- `split_participant_{code}`: participantId for auto-rejoin
- `split_last_name`: User's name for pre-fill
- `split_bill_history`: Array of recent bills

**Security implications:**
- participantId is used to identify the user without authentication
- Any user can forge localStorage to claim any participantId
- Frontend checks participantId validity but can't verify ownership

**Attack scenario:**
```javascript
// Attacker could set localStorage to impersonate another user
localStorage.setItem('split_participant_ABC123', 'victimParticipantId');
// Then navigate to /bill/ABC123 and act as that user
```

**Mitigation:**
- participantIds are UUIDs - attacker would need to know victim's ID
- IDs are only exposed in browser DevTools for that user
- Cross-user ID theft requires physical device access or XSS (React prevents)

**Recommendation:**
- Current model is acceptable for low-stakes bill splitting
- For higher security: Add session token issued on join, verified on mutations
- Document that the app trusts localStorage (no auth system)

---

### Summary: Data Exposure Issues

| Priority | Issue | Affected Queries |
|----------|-------|-----------------|
| MEDIUM | Receipt images accessible via any storageId | `receipts.getReceiptUrl` |
| LOW | Session enumeration theoretically possible | `sessions.getByCode` |
| LOW | Financial details visible to all session members | `participants.getTotals` |
| LOW | localStorage participantId can be spoofed | Frontend storage |

**Overall Data Exposure Assessment:**
The application follows a "trust within session" model:
- Anyone with the 6-char code can access full session data
- Session codes provide the access control boundary
- No authentication means anyone with the code is trusted

This is a deliberate design choice for frictionless bill splitting, but users should understand:
1. Don't share session codes publicly
2. Session data is visible to anyone who joins
3. Receipt images may contain sensitive information

The most actionable fix is adding sessionId verification to `getReceiptUrl` to prevent cross-session image access.

---

## Executive Summary

### Risk Overview

| Category | HIGH | MEDIUM | LOW |
|----------|------|--------|-----|
| Authorization | 2 | 4 | 2 |
| Input Validation | 0 | 4 | 2 |
| Data Exposure | 0 | 1 | 3 |
| **Total** | **2** | **9** | **7** |

### High Priority Issues

1. **`participants.updateName`** - Any user can change another user's name
2. **`claims.unclaim`** - Any user can remove another user's claims

### Medium Priority Issues (Top 5)

1. Session settings (tax/tip) modifiable by non-host
2. Items deletable/modifiable by any user
3. No input length limits on names
4. No numeric bounds on financial values
5. Receipt images accessible without session verification

### Design Decisions vs Security Gaps

Some findings may be **intentional design choices** for collaborative bill splitting:
- Any participant can add/edit items (collaborative editing)
- Any participant can claim items for others (helping each other)
- Financial totals visible to all (transparency)

The audit identified issues where the **API allows more than the UI intends**:
- UI restricts tax/tip to host; API allows anyone
- UI restricts unclaiming to own items; API allows unclaiming others'

### Recommended Action Priority

1. **Immediate:** Fix `updateName` and `unclaim` authorization
2. **Short-term:** Add input validation bounds
3. **Medium-term:** Add sessionId verification to `getReceiptUrl`
4. **Consider:** Rate limiting on `getByCode`

---

*Audit completed: 2026-01-15*
*Auditor: Claude (Security Review Phase)*

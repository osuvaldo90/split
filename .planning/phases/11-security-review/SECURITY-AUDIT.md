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


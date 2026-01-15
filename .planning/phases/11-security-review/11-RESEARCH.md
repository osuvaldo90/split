# Phase 11: Security Review - Research

**Researched:** 2026-01-15
**Domain:** Web application security audit for Convex + React anonymous session app
**Confidence:** HIGH

<research_summary>
## Summary

Researched security best practices for a Convex + React anonymous session application. The app has no user authentication (anonymous sessions only), uses Convex for backend/real-time sync, and stores minimal data in localStorage (participantId, preferences).

Key security domains for this audit:
1. **Convex authorization** - Ensuring mutations/queries check session ownership
2. **Input validation** - All public functions need argument validators
3. **IDOR prevention** - Verifying participants can only access their session data
4. **XSS prevention** - React's built-in protection + audit for dangerouslySetInnerHTML
5. **Data exposure** - Ensuring queries don't leak sensitive data to unauthorized users
6. **localStorage safety** - Verifying no sensitive data stored client-side

**Primary recommendation:** Audit every Convex function for authorization (session membership checks), ensure all arguments are validated with `v.*` validators, and verify no IDOR vulnerabilities exist where users can access other sessions' data.
</research_summary>

<standard_stack>
## Standard Stack

### Security Libraries/Tools for Convex Apps

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex/values (v) | Built-in | Argument validation | Runtime type checking, prevents malicious input |
| convex-helpers | 0.x | Custom functions, RLS | Official helper for auth patterns |
| DOMPurify | 3.x | HTML sanitization | If dangerouslySetInnerHTML used (verify needed) |

### Audit Tools

| Tool | Purpose | When to Use |
|------|---------|-------------|
| Manual code review | Authorization gaps | Every public function |
| ESLint | Static analysis | Floating promises, security patterns |
| Browser DevTools | Data exposure testing | Verify query responses |

### Not Needed for This App

| Library | Why Not Needed |
|---------|----------------|
| JWT/OAuth libraries | No user authentication (anonymous sessions) |
| Rate limiting | Consider for production, not critical for v1 |
| CORS handling | Using Convex client, not HTTP actions |
| CSP headers | Static hosting handles, minimal XSS risk |

</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Pattern 1: Session-Scoped Authorization (PRIMARY)

**What:** Every mutation/query that accesses session data must verify the caller belongs to that session.
**When to use:** ALL Convex functions that touch session, item, claim, or participant data.

**Example (from Convex best practices):**
```typescript
// GOOD: Verify participant belongs to session before allowing claim
export const claimItem = mutation({
  args: {
    itemId: v.id("items"),
    participantId: v.id("participants"),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const participant = await ctx.db.get(args.participantId);
    if (!participant) throw new Error("Participant not found");

    // AUTHORIZATION CHECK: participant must be in same session as item
    if (participant.sessionId !== item.sessionId) {
      throw new Error("Unauthorized");
    }

    // Now safe to create claim
    await ctx.db.insert("claims", { ... });
  }
});
```

**Anti-pattern:**
```typescript
// BAD: No verification that participant belongs to session
export const claimItem = mutation({
  args: { itemId: v.id("items"), participantId: v.id("participants") },
  handler: async (ctx, args) => {
    // Missing: Check participant.sessionId === item.sessionId
    await ctx.db.insert("claims", { ... });
  }
});
```

### Pattern 2: Argument Validation with v.*

**What:** Use Convex validators on ALL public function arguments.
**When to use:** Every query, mutation, action exposed to clients.

**Example:**
```typescript
// GOOD: Validates types at runtime
export const getSession = query({
  args: { code: v.string() },
  handler: async (ctx, args) => { ... }
});

// BAD: No validation, client could pass anything
export const getSession = query({
  handler: async (ctx, args) => {
    const code = args.code; // Could be anything!
  }
});
```

### Pattern 3: Minimal Data in Query Returns

**What:** Only return fields the client actually needs.
**When to use:** All queries that return data to clients.

**Example:**
```typescript
// GOOD: Return only what's needed
export const getParticipants = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    // Return only public fields
    return participants.map(p => ({
      _id: p._id,
      name: p.name,
      joinedAt: p.joinedAt,
      // NOT: any internal/sensitive fields
    }));
  }
});
```

### Pattern 4: Internal Functions for Sensitive Operations

**What:** Mark functions that should never be called from client as `internalMutation`/`internalQuery`.
**When to use:** Helper functions, scheduled jobs, admin operations.

**Example:**
```typescript
import { internalMutation } from "./_generated/server";

// Can only be called from other Convex functions, not from client
export const deleteExpiredSessions = internalMutation({
  handler: async (ctx) => { ... }
});
```

### Anti-Patterns to Avoid

- **Trusting client-provided IDs without verification:** Always verify the caller has permission to access/modify the referenced object
- **Missing argument validation:** Every public function needs `args` with validators
- **Exposing internal data in queries:** Return only fields needed by the UI
- **Floating promises:** Always await `ctx.db.*` operations
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Argument validation | Manual type checks | `v.*` validators | Runtime safety, TypeScript integration |
| Authorization patterns | Ad-hoc checks | Consistent pattern per function | Miss edge cases, inconsistent |
| HTML sanitization | Regex-based cleaning | DOMPurify | XSS edge cases, maintained library |
| Session ID generation | Custom random strings | Convex generates 6-char codes | Already implemented correctly |

**Key insight:** For this app, most security is about consistent authorization patterns, not adding libraries. The risk is inconsistent application of checks across functions, not missing tools.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: IDOR via participantId Manipulation
**What goes wrong:** User A sends their participantId to User B's session, accesses B's data
**Why it happens:** Mutation accepts participantId without verifying it matches the session
**How to avoid:** Every function must verify `participant.sessionId === session._id`
**Warning signs:** Mutations that accept participantId but don't load/verify the participant record

### Pitfall 2: Missing Argument Validators
**What goes wrong:** Malicious client sends unexpected types, causes runtime errors or bypasses logic
**Why it happens:** Function defined without `args` object, or with incomplete validators
**How to avoid:** Use `args: { field: v.type() }` for ALL public functions
**Warning signs:** Functions using `args.field` without declaring `field` in `args` object

### Pitfall 3: Query Returns Excessive Data
**What goes wrong:** Client receives internal fields (createdAt, internal status, etc.)
**Why it happens:** Returning full documents instead of mapped subset
**How to avoid:** Map query results to only return needed fields
**Warning signs:** Queries that `return await ctx.db.get(id)` directly

### Pitfall 4: Floating Promises
**What goes wrong:** Database operations silently fail, inconsistent state
**Why it happens:** Missing `await` on `ctx.db.*` calls
**How to avoid:** Enable `no-floating-promises` ESLint rule, review all db operations
**Warning signs:** `ctx.db.insert()` without `await`

### Pitfall 5: Session Code Enumeration
**What goes wrong:** Attacker brute-forces session codes to find active sessions
**Why it happens:** Short codes (6 chars) have limited keyspace
**How to avoid:** Rate limiting on join attempts (future enhancement)
**Warning signs:** Join endpoint allows unlimited attempts without throttling

### Pitfall 6: localStorage Sensitive Data
**What goes wrong:** XSS attack exfiltrates participantId, attacker impersonates user
**Why it happens:** Storing session tokens or IDs in localStorage
**How to avoid:** Only store non-sensitive preferences; participantId is low-risk but should be validated
**Warning signs:** Storing session secrets, auth tokens, or PII in localStorage
</common_pitfalls>

<code_examples>
## Code Examples

### Authorization Check Pattern
```typescript
// Source: Convex authorization best practices
// Every function that modifies session data should follow this pattern

export const updateItem = mutation({
  args: {
    itemId: v.id("items"),
    participantId: v.id("participants"),
    name: v.string(),
    priceInCents: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Load the entities
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const participant = await ctx.db.get(args.participantId);
    if (!participant) throw new Error("Participant not found");

    // 2. Verify authorization (participant is in same session as item)
    if (participant.sessionId !== item.sessionId) {
      throw new Error("Unauthorized: participant not in this session");
    }

    // 3. Now safe to perform the operation
    await ctx.db.patch(args.itemId, {
      name: args.name,
      priceInCents: args.priceInCents,
    });
  }
});
```

### Query with Minimal Data Return
```typescript
// Source: Convex best practices
// Return only fields needed by client

export const getSessionSummary = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    // Return only public fields, not internal state
    return {
      _id: session._id,
      code: session.code,
      createdAt: session._creationTime,
      taxInCents: session.taxInCents,
      tipInCents: session.tipInCents,
      // NOT: any internal fields like deletedAt, etc.
    };
  }
});
```

### Input Validation Example
```typescript
// Source: Convex validation docs
// All args must be validated

export const joinSession = mutation({
  args: {
    code: v.string(),  // Will reject non-strings at runtime
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // args.code is guaranteed to be a string here
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .unique();

    if (!session) throw new Error("Session not found");

    // Create participant...
  }
});
```
</code_examples>

<sota_updates>
## State of the Art (2024-2025)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual auth checks | Custom functions (convex-helpers) | 2024 | Centralized, consistent auth patterns |
| RLS by default | RLS optional, endpoint auth preferred | 2024 | Simpler, more explicit authorization |
| Basic arg validation | Required validators on all public functions | 2023+ | Runtime type safety standard |

**New tools/patterns to consider:**
- **convex-helpers customMutation:** Create typed wrappers that enforce auth patterns
- **Rate limiting component:** @convex-dev/ratelimiter for production hardening

**Not applicable to this app:**
- **Row-level security:** Overkill for simple session-scoped data; endpoint auth is clearer
- **Complex RBAC:** No roles in this app (anonymous participants only)
</sota_updates>

<audit_checklist>
## Security Audit Checklist

This checklist drives the Phase 11 planning:

### API Authorization
- [ ] Every mutation verifies caller has access to referenced session
- [ ] ParticipantId validated against session membership
- [ ] No function allows cross-session data access
- [ ] Host-only operations check isHost flag

### Input Validation
- [ ] All public functions have `args` with validators
- [ ] v.id() used for all ID arguments
- [ ] v.string(), v.number() for primitive values
- [ ] No unvalidated fields passed to database

### Data Exposure
- [ ] Queries return only needed fields (not full documents)
- [ ] No internal fields exposed to clients
- [ ] Error messages don't leak sensitive information
- [ ] Receipt images only accessible to session participants

### Client-Side Security
- [ ] No sensitive data in localStorage (only participantId, preferences)
- [ ] No dangerouslySetInnerHTML with unvalidated content
- [ ] No javascript: URLs in href attributes
- [ ] No eval() or Function() with user input

### Code Quality
- [ ] All promises awaited (no floating promises)
- [ ] Internal functions marked as internal
- [ ] No console.log of sensitive data in production
- [ ] TypeScript strict mode enabled
</audit_checklist>

<open_questions>
## Open Questions

1. **Rate limiting scope**
   - What we know: Convex has rate limiting component available
   - What's unclear: Whether v1 needs rate limiting or if it's overkill for initial users
   - Recommendation: Document as future enhancement, not critical for initial audit

2. **Session expiration enforcement**
   - What we know: Sessions "persist for days" per requirements
   - What's unclear: Whether expired session cleanup has security implications
   - Recommendation: Verify session queries check expiration if applicable

3. **Receipt image access control**
   - What we know: Receipt images stored in Convex file storage
   - What's unclear: Whether image URLs are session-scoped or globally accessible
   - Recommendation: Audit during data exposure review
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Convex Argument Validation Docs](https://docs.convex.dev/functions/validation) - Input validation patterns
- [Convex Authorization Best Practices](https://stack.convex.dev/authorization) - Authorization patterns, custom functions
- [Convex Best Practices](https://docs.convex.dev/understanding/best-practices/) - Public vs internal functions, validation

### Secondary (MEDIUM confidence)
- [OWASP Top 10 2025](https://owasp.org/www-project-top-ten/) - Industry-standard vulnerability categories
- [OWASP IDOR Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html) - IDOR patterns
- [React XSS Guide](https://www.stackhawk.com/blog/react-xss-guide-examples-and-prevention/) - XSS prevention in React
- [localStorage Security](https://snyk.io/blog/is-localstorage-safe-to-use/) - Client storage risks

### Tertiary (Supporting context)
- [Convex Row Level Security](https://stack.convex.dev/row-level-security) - When RLS is/isn't needed
- [Convex Rate Limiting](https://stack.convex.dev/rate-limiting) - Future enhancement reference
- [Session Hijacking Prevention](https://seraphicsecurity.com/learn/website-security/session-hijacking-in-2025-techniques-attack-examples-and-defenses/) - General web security
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Convex backend security, React frontend
- Ecosystem: convex-helpers, DOMPurify (if needed)
- Patterns: Session-scoped authorization, argument validation
- Pitfalls: IDOR, missing validators, data exposure, floating promises

**Confidence breakdown:**
- Authorization patterns: HIGH - directly from Convex official docs
- Input validation: HIGH - Convex documentation and best practices
- IDOR prevention: HIGH - OWASP + Convex patterns
- React security: HIGH - well-documented React defaults
- localStorage: HIGH - industry consensus

**Research date:** 2026-01-15
**Valid until:** 2026-02-15 (30 days - security best practices stable)
</metadata>

---

*Phase: 11-security-review*
*Research completed: 2026-01-15*
*Ready for planning: yes*

# Phase 1: Foundation - Research

**Researched:** 2026-01-14
**Domain:** Real-time sync technologies for collaborative web apps
**Confidence:** HIGH

<research_summary>
## Summary

Researched the real-time sync ecosystem for building a collaborative bill-splitting app. The key requirement is instant synchronization across multiple users (host + participants) with a simple session-based model, mobile-first, no offline requirements.

**Finding:** For this specific use case (ephemeral sessions, simple state, collaborative claiming), **Convex** emerges as the strongest choice due to automatic real-time sync, excellent developer experience, strong Claude/AI tooling familiarity, and a generous free tier. **Supabase** is a close second with broader ecosystem and MCP integration, but requires more manual real-time setup.

**Primary recommendation:** Use Convex for real-time state management + React. The `useQuery` hook provides automatic UI updates when data changes, eliminating manual subscription management. Claude has extensive documentation access and the TypeScript-native approach aligns well with AI-assisted development.
</research_summary>

<standard_stack>
## Standard Stack

### Core Options Evaluated

| Technology | Type | Real-Time Model | Claude Familiarity | Best For |
|------------|------|-----------------|-------------------|----------|
| **Convex** | Reactive DB + Backend | Automatic (built-in) | HIGH | This app |
| **Supabase** | PostgreSQL BaaS | Opt-in (channels) | HIGH (MCP exists) | SQL-heavy apps |
| **PartyKit** | Edge WebSocket | Manual (low-level) | MEDIUM | Custom protocols |
| **Firebase** | NoSQL BaaS | Automatic | HIGH | Google ecosystem |
| **Socket.IO** | WebSocket library | Manual | HIGH | Custom backends |

### Recommended: Convex Stack

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | ^1.x | Reactive database + backend | Automatic real-time, TypeScript-native |
| @tanstack/react-query | ^5.x | Optional query caching | Convex has built-in caching |
| react | ^18.x | UI framework | Standard |
| vite | ^5.x | Build tooling | Fast, modern |

### Alternative: Supabase Stack

| Library | Version | Purpose | Why Consider |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.x | Database + auth + realtime | PostgreSQL power, MCP integration |
| @supabase/ssr | ^0.x | Server-side rendering support | Next.js compatibility |

### Installation (Convex - Recommended)

```bash
npm create convex@latest
# Or manually:
npm create vite@latest split -- --template react-ts
cd split
npm install convex
npx convex dev
```

### Installation (Supabase - Alternative)

```bash
npm create vite@latest split -- --template react-ts
cd split
npm install @supabase/supabase-js
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure (Convex)

```
src/
├── components/
│   ├── Session/         # Session creation, joining
│   ├── Receipt/         # Receipt display, item list
│   ├── Claiming/        # Item claiming UI
│   └── Summary/         # Per-person totals
├── convex/
│   ├── schema.ts        # Database schema
│   ├── sessions.ts      # Session queries/mutations
│   ├── items.ts         # Item queries/mutations
│   └── claims.ts        # Claiming logic
├── hooks/
│   └── useSession.ts    # Session state hook
└── App.tsx
```

### Pattern 1: Convex Reactive Queries

**What:** Queries automatically re-run and update UI when data changes
**When to use:** All data fetching
**Example:**
```typescript
// convex/sessions.ts
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getSession = query({
  args: { sessionCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sessions")
      .withIndex("by_code", (q) => q.eq("code", args.sessionCode))
      .first();
  },
});

// React component
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function SessionView({ code }: { code: string }) {
  // Automatically updates when session changes!
  const session = useQuery(api.sessions.getSession, { sessionCode: code });

  if (!session) return <div>Loading...</div>;
  return <div>{session.name}</div>;
}
```

### Pattern 2: Convex Mutations

**What:** Transactional writes that trigger reactive updates
**When to use:** Any state change (claim item, update name, etc.)
**Example:**
```typescript
// convex/claims.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const claimItem = mutation({
  args: {
    itemId: v.id("items"),
    participantId: v.id("participants")
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    await ctx.db.patch(args.itemId, {
      claimedBy: [...(item.claimedBy || []), args.participantId],
    });
  },
});

// React component
import { useMutation } from "convex/react";

function ItemRow({ item }) {
  const claimItem = useMutation(api.claims.claimItem);

  return (
    <button onClick={() => claimItem({ itemId: item._id, participantId })}>
      Claim
    </button>
  );
}
```

### Pattern 3: Supabase Realtime Channels (Alternative)

**What:** Pub/sub for custom real-time events
**When to use:** If choosing Supabase
**Example:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(URL, KEY);

// Subscribe to session changes
const channel = supabase
  .channel(`session:${sessionCode}`)
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'claims', filter: `session_id=eq.${sessionId}` },
    (payload) => {
      // Update local state
      setClaims(prev => [...prev, payload.new]);
    }
  )
  .subscribe();

// Cleanup
return () => supabase.removeChannel(channel);
```

### Anti-Patterns to Avoid

- **Manual polling for updates:** Use reactive queries or WebSocket subscriptions instead
- **Local state for shared data:** All session state should live in the real-time database
- **Complex client-side sync logic:** Let the platform handle conflict resolution
- **useEffect subscription soup:** Convex's useQuery handles subscriptions automatically
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time sync | Custom WebSocket server | Convex/Supabase | Connection management, reconnection, conflict resolution are complex |
| Session codes | Random string generation | nanoid or Convex ID | Collision handling, URL-safe encoding |
| Optimistic updates | Manual state reconciliation | Convex mutations | They handle rollback on failure automatically |
| Presence tracking | Custom ping/heartbeat | Supabase Presence or Convex | Edge cases (tab close, network drop) are tricky |
| Authentication | JWT from scratch | Clerk/Auth0 (if needed) | Session management, security best practices |

**Key insight:** Real-time collaborative apps have solved problems that look simple but aren't. Connection drops, race conditions, and state conflicts require careful handling. Both Convex and Supabase abstract this away.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: React Strict Mode Double Subscriptions

**What goes wrong:** WebSocket connections established twice, duplicate events
**Why it happens:** StrictMode mounts/unmounts components twice in dev
**How to avoid:** Convex handles this automatically; for Supabase, ensure cleanup in useEffect
**Warning signs:** Duplicate items appearing, counts doubling

### Pitfall 2: Stale Closures in Real-Time Callbacks

**What goes wrong:** Callbacks reference old state values
**Why it happens:** JavaScript closure captures state at subscription time
**How to avoid:** Use functional state updates `setState(prev => ...)` or refs
**Warning signs:** Data appears to revert or not update correctly

### Pitfall 3: Missing Loading States

**What goes wrong:** Flash of empty content, hydration mismatches
**Why it happens:** Not handling the initial query loading state
**How to avoid:** Always check for undefined/loading before rendering data
**Warning signs:** Layout shifts, empty screens on navigation

### Pitfall 4: Over-Subscribing

**What goes wrong:** Performance degradation, excessive bandwidth
**Why it happens:** Subscribing to entire tables instead of filtered queries
**How to avoid:** Use specific query filters (by session ID, by participant)
**Warning signs:** Slow updates, high data usage on mobile

### Pitfall 5: Ignoring Optimistic Update Rollback

**What goes wrong:** UI shows change, then reverts confusingly
**Why it happens:** Mutation failed but optimistic UI wasn't handled
**How to avoid:** Show loading states during mutations, handle errors explicitly
**Warning signs:** "Flickering" UI states
</common_pitfalls>

<code_examples>
## Code Examples

### Convex Setup (main.tsx)

```typescript
// Source: Convex React Quickstart
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import App from './App';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>
);
```

### Convex Schema Example

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    code: v.string(),
    hostName: v.string(),
    createdAt: v.number(),
    receiptImageUrl: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    tax: v.optional(v.number()),
    tip: v.optional(v.number()),
  }).index("by_code", ["code"]),

  participants: defineTable({
    sessionId: v.id("sessions"),
    name: v.string(),
    isHost: v.boolean(),
    joinedAt: v.number(),
  }).index("by_session", ["sessionId"]),

  items: defineTable({
    sessionId: v.id("sessions"),
    name: v.string(),
    price: v.number(),
    quantity: v.number(),
  }).index("by_session", ["sessionId"]),

  claims: defineTable({
    itemId: v.id("items"),
    participantId: v.id("participants"),
    shareCount: v.number(), // For split items
  }).index("by_item", ["itemId"])
    .index("by_participant", ["participantId"]),
});
```

### Real-Time Session Hook

```typescript
// hooks/useSession.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function useSession(code: string) {
  const session = useQuery(api.sessions.getSession, { sessionCode: code });
  const participants = useQuery(
    api.participants.listBySession,
    session ? { sessionId: session._id } : "skip"
  );
  const items = useQuery(
    api.items.listBySession,
    session ? { sessionId: session._id } : "skip"
  );

  const claimItem = useMutation(api.claims.claimItem);
  const unclaimItem = useMutation(api.claims.unclaimItem);

  return {
    session,
    participants,
    items,
    isLoading: session === undefined,
    claimItem,
    unclaimItem,
  };
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firebase RTDB | Convex or Supabase | 2023-2024 | Better DX, SQL support, open source options |
| Socket.IO manually | Managed real-time platforms | 2023+ | Less DevOps, automatic scaling |
| Redux + manual sync | Convex reactive queries | 2024+ | Eliminates client state management |
| REST polling | WebSocket-first | 2020+ | Better UX, lower latency |

**New tools/patterns to consider:**
- **Convex**: Reactive database with TypeScript-native backend (2024+ maturity)
- **Supabase MCP**: Direct Claude Code integration for database management
- **PartyKit on Cloudflare**: Now free, good for custom protocols

**Deprecated/outdated:**
- **Firebase Realtime Database**: Firestore preferred, vendor lock-in concerns
- **Custom WebSocket servers**: Managed platforms handle edge cases better
- **Polling-based sync**: Unacceptable for collaborative UX
</sota_updates>

<claude_effectiveness>
## Claude Effectiveness Assessment

| Technology | Claude Familiarity | MCP/Tooling | Documentation Quality | Recommendation |
|------------|-------------------|-------------|----------------------|----------------|
| **Convex** | HIGH | No official MCP, but TypeScript-native | Excellent, current | Recommended |
| **Supabase** | HIGH | Official MCP server exists | Excellent, current | Strong alternative |
| **PartyKit** | MEDIUM | None | Good, newer | For custom needs |
| **Firebase** | HIGH | None | Excellent | If already invested |

### Why Convex Works Best with Claude

1. **TypeScript-native**: All backend code is TypeScript, which Claude excels at
2. **Declarative patterns**: Schema + queries + mutations map cleanly to Claude's strengths
3. **No SQL required**: Claude doesn't need to generate SQL; it's all TypeScript
4. **Automatic reactivity**: Less code to write = less for Claude to get wrong
5. **Clear documentation**: Convex docs are well-structured and current

### Why Supabase is a Strong Alternative

1. **MCP integration**: Claude Code can directly manage Supabase databases
2. **Mature ecosystem**: More tutorials, examples, Stack Overflow answers
3. **PostgreSQL**: If you need SQL power later
4. **Open source**: No vendor lock-in concerns

### Decision Matrix for This Project

| Requirement | Convex | Supabase | Winner |
|-------------|--------|----------|--------|
| Real-time sync (automatic) | Built-in | Requires setup | Convex |
| Simple ephemeral sessions | Perfect fit | Works fine | Tie |
| Mobile-first | Both work | Both work | Tie |
| Claude effectiveness | TypeScript-native | MCP exists | Convex (slight) |
| Free tier | 1M function calls | Generous | Tie |
| Vendor lock-in | Closed source | Open source | Supabase |
| Future SQL needs | Limited | Full PostgreSQL | Supabase |

**Verdict:** Convex for simplicity and automatic real-time. Supabase if you want SQL escape hatch.
</claude_effectiveness>

<open_questions>
## Open Questions

1. **Session persistence duration**
   - What we know: Convex has no auto-expiry; Supabase can use database triggers
   - What's unclear: How long should sessions live? 24 hours? Until manually deleted?
   - Recommendation: Implement soft-delete with `expiresAt` field, clean up via scheduled function

2. **Host vs participant permissions**
   - What we know: Both platforms support row-level logic
   - What's unclear: Should participants be able to edit items or only claim?
   - Recommendation: Start permissive, add restrictions if needed

3. **Offline handling**
   - What we know: Context says "no offline requirements"
   - What's unclear: What happens if someone's phone loses signal mid-claim?
   - Recommendation: Both platforms handle reconnection; trust the platform
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react) - Setup, hooks, patterns
- [Convex Understanding](https://docs.convex.dev/understanding/) - Core concepts
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) - Broadcast, Presence, Postgres Changes
- [PartyKit Docs](https://docs.partykit.io/how-partykit-works/) - Architecture

### Secondary (MEDIUM confidence)
- [Convex vs Supabase 2025](https://makersden.io/blog/convex-vs-supabase-2025) - Comparison verified against official docs
- [Firebase vs Supabase](https://ably.com/compare/firebase-vs-supabase) - Industry comparison
- [Claude + Supabase Integration](https://www.arsturn.com/blog/supabase-mcp-claude-code-dev-power-up) - MCP workflow

### Tertiary (needs validation during implementation)
- Pricing tiers may change; verify at [Convex Pricing](https://www.convex.dev/pricing) and [Supabase Pricing](https://supabase.com/pricing)
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: Real-time sync platforms
- Ecosystem: Convex, Supabase, PartyKit, Firebase, Socket.IO
- Patterns: Reactive queries, WebSocket subscriptions, optimistic updates
- Pitfalls: Strict mode, closures, loading states

**Confidence breakdown:**
- Standard stack: HIGH - verified with official docs
- Architecture: HIGH - from official quickstarts and examples
- Pitfalls: HIGH - documented in GitHub issues and official guides
- Code examples: HIGH - adapted from official documentation
- Claude effectiveness: MEDIUM - based on TypeScript familiarity and MCP availability

**Research date:** 2026-01-14
**Valid until:** 2026-02-14 (30 days - ecosystem relatively stable)
</metadata>

---

*Phase: 01-foundation*
*Research completed: 2026-01-14*
*Ready for planning: yes*

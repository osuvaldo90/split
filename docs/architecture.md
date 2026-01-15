# Architecture Overview

Split is a mobile-first bill splitting app with real-time collaborative editing. No authentication required - session codes provide access control.

## Data Model

```
sessions
  |-- code (6-char alphanumeric, shareable)
  |-- hostName
  |-- subtotal, tax, gratuity (in cents)
  |-- tipType, tipValue
  |
  +-- participants (by sessionId)
  |     |-- name
  |     |-- isHost (boolean)
  |     |-- joinedAt
  |
  +-- items (by sessionId)
  |     |-- name
  |     |-- price (in cents)
  |     |-- quantity
  |
  +-- claims (by sessionId, itemId, participantId)
        Links participants to items they're paying for
```

**Key relationships:**
- A session has many participants and items
- Claims are a many-to-many join between participants and items
- All tables include denormalized `sessionId` for efficient session-scoped queries

## Key Patterns

### Claims Model

Multiple participants can claim the same item. The price splits equally among all claimants.

```typescript
// $10 item claimed by 3 people = $3.34 + $3.33 + $3.33
const shares = calculateItemShare(1000, 3); // [334, 333, 333]
```

- First N claimants get the extra cents when division is uneven
- Unclaimed items show a warning but don't block the flow
- Claims stored as separate records (not an array) for efficient queries

### Real-time Sync (Convex)

All data changes broadcast automatically via Convex subscriptions.

```typescript
// This query automatically re-runs when any session data changes
const session = useQuery(api.sessions.get, { code });
```

- No manual polling or WebSocket management
- UI components subscribe to queries and update reactively
- Mutations trigger immediate optimistic updates

### Draft State for New Items

New items are created in local React state first, only saved to the database when the user finishes editing.

```typescript
// Local draft prevents empty items from appearing to other users
const [draft, setDraft] = useState<DraftItem | null>(null);
```

- Prevents "Item 1" placeholder from broadcasting
- Only one draft allowed at a time
- Draft commits to DB on blur/save

### Participant Verification

Session access uses `participantId` stored in localStorage, verified on load.

```typescript
// Verify participant still exists and belongs to this session
const participant = await ctx.db.get(participantId);
if (!participant || participant.sessionId !== session._id) {
  throw new Error("Invalid participant");
}
```

- Host identified by `isHost: true` flag
- Host-only actions (delete bill, remove items) check this flag
- Authorization happens in Convex mutations, not frontend

### Money Handling

All prices stored as integers (cents) to avoid floating point issues.

```typescript
// Store: 1999 cents, not 19.99
// Display: (price / 100).toFixed(2) -> "19.99"
```

- Subtotal, tax, tip, gratuity all in cents
- Math operations use integer arithmetic
- Format only at display time

### Proportional Distribution

Tax and tip distributed by each participant's share of the claimed subtotal.

```typescript
// distributeWithRemainder ensures sum equals total exactly
const taxShares = distributeWithRemainder(totalTax, participantSubtotals);
```

- Uses largest-fractional-remainder method for rounding
- Guarantees no penny left behind or created
- Same helper used for tax, tip, and auto-gratuity

## Security Model

- **Session codes** are the access control boundary (6-char alphanumeric)
- **Authorization** checked in mutations:
  - Host-only: delete session, update totals via receipt
  - All participants: claim/unclaim items, edit items
- **Input validation** with bounds:
  - Names: 100 chars max
  - Item names: 200 chars max
  - Money: $100,000 max
  - Quantity: 999 max
- **Receipt storage** verifies session ownership before serving images

See `.planning/phases/11-security-review/SECURITY-AUDIT.md` for the full security audit.

## Key Files

| File | Purpose |
|------|---------|
| `convex/schema.ts` | Data model definition |
| `convex/calculations.ts` | Tax/tip distribution logic |
| `convex/validation.ts` | Input validation helpers |
| `convex/claims.ts` | Claim/unclaim mutations |
| `convex/sessions.ts` | Session CRUD and code generation |
| `src/components/Summary.tsx` | Per-person total breakdown |
| `src/components/ClaimableItem.tsx` | Item claiming UI |
| `src/components/InlineItem.tsx` | Inline item editing |

## Design Decisions

Key decisions are documented in `.planning/STATE.md` under "Accumulated Context > Decisions". Notable ones:

- **No authentication** - Session codes are sufficient for casual bill splitting
- **Prices in cents** - Avoids floating point math errors
- **Denormalized sessionId** - Every table has sessionId for efficient scoped queries
- **Separate claims table** - Many-to-many allows item splitting without arrays
- **Draft state pattern** - Prevents incomplete items from broadcasting

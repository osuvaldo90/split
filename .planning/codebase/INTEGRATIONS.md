# External Integrations

**Analysis Date:** 2025-01-16

## APIs & External Services

**AI/ML:**
- Anthropic Claude API - Receipt image parsing via Vision API
  - SDK: `@anthropic-ai/sdk` v0.71.2
  - Auth: `ANTHROPIC_API_KEY` environment variable (set in Convex dashboard)
  - Model: `claude-sonnet-4-5-20250929`
  - Usage: `convex/actions/parseReceipt.ts`

**Analytics:**
- Vercel Analytics - Page view and interaction tracking
  - SDK: `@vercel/analytics` v1.6.1
  - Implementation: `<Analytics />` component in `src/App.tsx`
  - Auth: Automatic via Vercel deployment

## Data Storage

**Database:**
- Convex Cloud - Real-time document database
  - Connection: `VITE_CONVEX_URL` environment variable
  - Client: `ConvexReactClient` from `convex/react`
  - Schema: `convex/schema.ts`
  - Tables: `sessions`, `participants`, `items`, `claims`

**File Storage:**
- Convex Storage - Receipt image storage
  - API: `ctx.storage.generateUploadUrl()`, `ctx.storage.get()`, `ctx.storage.getUrl()`
  - Usage: `convex/receipts.ts` (upload URLs), `convex/actions/parseReceipt.ts` (read images)
  - Reference: `receiptImageId` field in sessions table (type: `v.id("_storage")`)

**Client-Side Storage:**
- localStorage - Session persistence and bill history
  - `src/lib/sessionStorage.ts` - Participant ID per session (`split_session_{code}`)
  - `src/lib/billHistory.ts` - Recent bills list (`split_bill_history`, max 10 entries)
  - `src/lib/userPreferences.ts` - User preferences

**Caching:**
- None (Convex handles real-time sync)

## Authentication & Identity

**Auth Provider:**
- None (anonymous access)
  - Implementation: Participants identified by localStorage-stored ID
  - Host/participant permissions verified per-mutation via `participantId` arg
  - No user accounts or authentication required

**Authorization Model:**
- Session-based: Users join sessions with a name
- Host privileges: First participant in session is host
- Permission checks: Mutations verify `participant.isHost` for restricted operations

## Monitoring & Observability

**Error Tracking:**
- None configured

**Logs:**
- Convex dashboard (function logs)
- Browser console (development)

## CI/CD & Deployment

**Frontend Hosting:**
- Vercel
  - Auto-deploy on push
  - SPA routing via `vercel.json` rewrites

**Backend Hosting:**
- Convex Cloud
  - Deploy via `npx convex deploy`
  - Dev mode: `npx convex dev`

**CI Pipeline:**
- None detected (no `.github/workflows/` or similar)

## Environment Configuration

**Required Environment Variables:**

Frontend (Vite):
```env
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

Backend (Convex Dashboard):
```env
ANTHROPIC_API_KEY=sk-ant-...
```

**Local Development:**
- `.env.local` - Local environment variables (gitignored)
- Convex dev mode syncs environment from dashboard

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Real-Time Sync

**Convex Subscriptions:**
- All queries (`useQuery`) are reactive
- Automatic re-render on data changes
- WebSocket connection managed by `ConvexReactClient`

**Subscription Points:**
- `sessions.getByCode` - Session lookup
- `sessions.get` - Session details
- `participants.listBySession` - Participant list
- `participants.getTotals` - Real-time calculation updates
- `items.listBySession` - Item list
- `claims.listBySession` - Claim list

## API Endpoints Summary

**Convex Queries (read-only, reactive):**
- `api.sessions.getByCode` - Find session by share code
- `api.sessions.get` - Get session by ID
- `api.participants.listBySession` - List session participants
- `api.participants.getById` - Get participant by ID
- `api.participants.getTotals` - Calculate per-participant totals
- `api.items.listBySession` - List session items
- `api.claims.listBySession` - List item claims
- `api.receipts.getReceiptUrl` - Get receipt image URL

**Convex Mutations (write operations):**
- `api.sessions.create` - Create new session
- `api.sessions.updateTip` - Update tip settings (host only)
- `api.sessions.updateTax` - Update tax (host only)
- `api.sessions.updateTotals` - Update subtotal/tax from OCR
- `api.sessions.updateGratuity` - Update auto-gratuity (host only)
- `api.participants.join` - Join session
- `api.participants.updateName` - Update participant name
- `api.items.create` - Add item
- `api.items.update` - Edit item
- `api.items.remove` - Delete item
- `api.items.bulkCreate` - Add multiple items (from OCR)
- `api.claims.toggle` - Toggle item claim
- `api.receipts.generateUploadUrl` - Get upload URL for receipt
- `api.receipts.saveReceiptImage` - Link uploaded image to session

**Convex Actions (server-side with external calls):**
- `api.actions.parseReceipt.parseReceipt` - Parse receipt image via Claude Vision

---

*Integration audit: 2025-01-16*

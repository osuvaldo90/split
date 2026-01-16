# Architecture

**Analysis Date:** 2026-01-16

## Pattern Overview

**Overall:** Full-stack serverless with Backend-for-Frontend (BFF) pattern

**Key Characteristics:**
- React SPA frontend with Convex backend-as-a-service
- Real-time data synchronization via Convex subscriptions
- Serverless functions (queries, mutations, actions) handle all backend logic
- No traditional REST API - direct function calls from client
- AI-powered OCR via Convex actions (Node.js runtime)

## Layers

**Frontend (React SPA):**
- Purpose: User interface, routing, local state management
- Location: `src/`
- Contains: Pages, components, client-side utilities
- Depends on: Convex React client, generated API types
- Used by: Browser clients (mobile-first design)

**Backend (Convex Functions):**
- Purpose: Data persistence, business logic, authorization
- Location: `convex/`
- Contains: Queries (reads), mutations (writes), actions (external APIs), schema
- Depends on: Convex runtime, external SDKs (Anthropic)
- Used by: Frontend via Convex React hooks

**Client Utilities:**
- Purpose: Browser storage, session persistence, preferences
- Location: `src/lib/`
- Contains: localStorage wrappers, type-safe utilities
- Depends on: Browser APIs
- Used by: Frontend pages/components

## Data Flow

**Session Creation Flow:**

1. User enters name on `Home.tsx`
2. `useMutation(api.sessions.create)` called
3. Convex generates unique 6-char code, creates session + host participant
4. Returns `{ sessionId, code, hostParticipantId }`
5. Client stores `participantId` in localStorage, navigates to `/bill/{code}`

**Receipt Processing Flow:**

1. User captures/uploads image in `ReceiptCapture.tsx`
2. Image uploaded to Convex storage via `receipts.generateUploadUrl`
3. `useAction(api.actions.parseReceipt.parseReceipt)` calls Claude Vision API
4. Parsed items returned, client calls `items.addBulk` mutation
5. Items appear instantly via real-time subscription

**Item Claiming Flow:**

1. User taps item in `ClaimableItem.tsx`
2. `useMutation(api.claims.claim)` creates claim record
3. All participants see claim instantly via `useQuery` subscription
4. Summary recalculates totals in real-time

**State Management:**
- Server state: Convex queries with automatic subscriptions
- UI state: React useState (local component state)
- Persistence: localStorage for session/participant IDs
- No global state library - Convex handles cross-component sync

## Key Abstractions

**Session:**
- Purpose: Represents a bill-splitting event
- Examples: `convex/sessions.ts`, `convex/schema.ts`
- Pattern: Central entity linking participants, items, claims

**Participant:**
- Purpose: User identity within a session
- Examples: `convex/participants.ts`
- Pattern: Stateless (no auth), identified by localStorage ID

**Item:**
- Purpose: Line item from receipt or manual entry
- Examples: `convex/items.ts`, `src/components/ClaimableItem.tsx`
- Pattern: Owned by session, claimed by participants

**Claim:**
- Purpose: Junction table linking participants to items
- Examples: `convex/claims.ts`
- Pattern: Denormalized with sessionId for efficient queries

**Calculation Helpers:**
- Purpose: Pure functions for bill math
- Examples: `convex/calculations.ts`
- Pattern: Integer math (cents) to avoid floating point

## Entry Points

**Client Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads app
- Responsibilities: Initialize React, Convex client, render App

**Routing Entry:**
- Location: `src/App.tsx`
- Triggers: URL navigation
- Responsibilities: Route matching, layout composition

**Backend Entry:**
- Location: `convex/` (each exported function)
- Triggers: Client calls via Convex hooks
- Responsibilities: Data operations, authorization, validation

## Error Handling

**Strategy:** Fail-fast with user-friendly messages

**Patterns:**
- Validation functions throw descriptive errors (`convex/validation.ts`)
- Convex errors propagate to client, parsed for display
- Client shows inline error messages, retry buttons
- Silent failures for non-critical localStorage operations

## Cross-Cutting Concerns

**Logging:** Console only (Vercel/Convex dashboards for production)

**Validation:**
- Server-side in `convex/validation.ts`
- Validates names, money (cents), quantities, tip percentages
- Max limits prevent DoS (500 items, $100k amounts)

**Authentication:**
- Stateless - no user accounts
- Session persistence via localStorage participantId
- Authorization checks in each mutation (isHost checks)

**Real-time Updates:**
- Convex handles WebSocket connections
- All queries auto-subscribe to changes
- `ConnectionStatus.tsx` shows disconnection state

---

*Architecture analysis: 2026-01-16*

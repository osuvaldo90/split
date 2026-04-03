# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (run in separate terminals)
npx convex dev          # Start Convex backend
npm run dev             # Start Vite frontend (http://localhost:5173)

# Build
npm run build           # TypeScript check + Vite build

# Testing
npm test                # Run unit tests (Vitest) once
npm run test:watch      # Run unit tests in watch mode
npm run test:e2e        # Run Playwright E2E tests
npm run test:all        # Run unit + E2E tests

# Lint
npm run lint            # Run ESLint
```

To run a single test file: `npx vitest run convex/calculations.test.ts`

## Architecture

**Split** is a real-time collaborative bill-splitting app. No authentication — 6-character alphanumeric session codes are the security boundary.

### Stack
- **Frontend**: React 19 + React Router 7 + TailwindCSS 4, built with Vite
- **Backend**: [Convex](https://convex.dev) — serverless real-time database with TypeScript functions
- **AI**: Anthropic SDK — Claude Vision API for receipt OCR via `convex/actions/parseReceipt.ts`

### Key Architectural Patterns

**Money is always integers (cents).** Never use floats for prices. The "largest remainder method" in `convex/calculations.ts` ensures tax/tip always sums exactly to the total.

**Convex real-time subscriptions.** Frontend components use `useQuery(api.*)` to subscribe to live data — no manual polling or WebSocket management. Mutations trigger automatic re-renders across all connected clients.

**Claims are a separate table.** Item splitting uses a many-to-many `claims` table (`itemId` + `participantId`) rather than arrays on items. This enables efficient per-session queries.

**Draft state pattern.** New items live in local React state until the user finishes editing, preventing incomplete items from broadcasting to other participants. Only one draft allowed at a time (in `src/pages/Session.tsx`).

**Participant verification without auth.** Each participant gets a UUID stored in `localStorage` (keyed by session code via `src/lib/sessionStorage.ts`). Mutations verify this ID against the DB. Host-only actions additionally check `isHost: true`.

**Every table has `sessionId`.** Denormalized for efficient session-scoped queries — all indexes include `sessionId`.

### Backend (`convex/`)
- `schema.ts` — Data model: `sessions`, `participants`, `items`, `claims`, `fees`
- `calculations.ts` — Pure tax/tip distribution logic (heavily tested)
- `sessions.ts` / `participants.ts` / `items.ts` / `claims.ts` / `fees.ts` — CRUD mutations and queries
- `actions/parseReceipt.ts` — Calls Claude Vision API with Structured Outputs, confidence threshold 0.7+
- `validation.ts` — Input bounds (names ≤100 chars, items ≤200 chars, money ≤$100k)

### Frontend (`src/`)
- `pages/Home.tsx` — Create/join sessions, local history via `lib/billHistory.ts`
- `pages/Session.tsx` — Main bill workspace; manages receipt processing state machine
- `components/Summary.tsx` — Per-person breakdown (subtotal + proportional tax/tip)
- `components/TaxTipSettings.tsx` — Configure tax/tip (percent of subtotal, percent of total, or fixed)

### Environment Variables
- `ANTHROPIC_API_KEY` — Required in `.env.local` for receipt OCR
- `VITE_CONVEX_URL` — Set automatically by `npx convex dev`

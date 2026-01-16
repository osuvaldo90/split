# Codebase Structure

**Analysis Date:** 2026-01-16

## Directory Layout

```
split/
├── convex/                 # Backend (Convex serverless functions)
│   ├── _generated/         # Auto-generated types and API client
│   ├── actions/            # Node.js actions (external API calls)
│   ├── schema.ts           # Database schema definition
│   ├── sessions.ts         # Session queries and mutations
│   ├── participants.ts     # Participant management + totals calculation
│   ├── items.ts            # Item CRUD operations
│   ├── claims.ts           # Claim/unclaim operations
│   ├── receipts.ts         # File upload handling
│   ├── calculations.ts     # Pure calculation functions
│   ├── validation.ts       # Input validation helpers
│   └── *.test.ts           # Unit tests (co-located)
├── src/                    # Frontend (React SPA)
│   ├── components/         # Reusable UI components
│   ├── pages/              # Route-level components
│   ├── lib/                # Client-side utilities
│   ├── App.tsx             # Router configuration
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles (Tailwind)
├── e2e/                    # Playwright E2E tests
├── tests/                  # Additional test utilities
├── .planning/              # Project planning documents
├── docs/                   # User-facing documentation
├── public/                 # Static assets
└── dist/                   # Build output (gitignored)
```

## Directory Purposes

**`convex/`:**
- Purpose: All backend logic runs here
- Contains: Queries, mutations, actions, schema, tests
- Key files:
  - `schema.ts`: Database table definitions with indexes
  - `participants.ts`: Contains `getTotals` - the core calculation logic
  - `actions/parseReceipt.ts`: Claude Vision API integration

**`convex/_generated/`:**
- Purpose: Convex codegen output
- Contains: TypeScript types for schema, API client exports
- Generated: Yes (auto-generated on `convex dev`)
- Committed: Yes

**`src/components/`:**
- Purpose: Reusable React components
- Contains: UI building blocks, forms, displays
- Key files:
  - `ClaimableItem.tsx`: Core item interaction (tap to claim, edit)
  - `Summary.tsx`: Per-participant totals display
  - `TaxTipSettings.tsx`: Tax/tip configuration form
  - `JoinGate.tsx`: Join flow for non-participants

**`src/pages/`:**
- Purpose: Route-level page components
- Contains: Two pages matching routes
- Key files:
  - `Home.tsx`: Landing page, create/join bill form
  - `Session.tsx`: Main bill view with tabs

**`src/lib/`:**
- Purpose: Client-side utilities (non-React)
- Contains: localStorage wrappers, type definitions
- Key files:
  - `sessionStorage.ts`: Participant ID persistence
  - `billHistory.ts`: Recent bills list
  - `userPreferences.ts`: Name auto-fill

**`e2e/`:**
- Purpose: End-to-end browser tests
- Contains: Playwright test specs
- Key files:
  - `host-flow.spec.ts`: Host creates bill, adds items
  - `join-flow.spec.ts`: Guest joins, claims items

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React app bootstrap, Convex provider setup
- `index.html`: HTML shell with root div

**Configuration:**
- `convex/schema.ts`: Database schema (sessions, participants, items, claims)
- `tsconfig.json`: TypeScript config (strict mode)
- `vite.config.ts`: Vite build config
- `vitest.config.ts`: Unit test config
- `playwright.config.ts`: E2E test config

**Core Logic:**
- `convex/calculations.ts`: Bill splitting math (pure functions)
- `convex/participants.ts:getTotals`: Central calculation query
- `convex/validation.ts`: Input sanitization/validation
- `convex/actions/parseReceipt.ts`: Receipt OCR via Claude

**Testing:**
- `convex/*.test.ts`: Unit tests for backend functions
- `e2e/*.spec.ts`: E2E browser tests

## Naming Conventions

**Files:**
- Components: PascalCase (`ClaimableItem.tsx`, `TaxTipSettings.tsx`)
- Utilities: camelCase (`sessionStorage.ts`, `billHistory.ts`)
- Backend modules: camelCase (`sessions.ts`, `participants.ts`)
- Tests: `{module}.test.ts` or `{feature}.spec.ts`

**Directories:**
- Lowercase, singular (`components`, `lib`, `actions`)
- Generated: Prefixed with underscore (`_generated`)

**Exports:**
- Components: Default export matching filename
- Backend functions: Named exports (`export const create = mutation(...)`)
- Utilities: Named exports (`export function getStoredParticipant`)

## Where to Add New Code

**New Feature (full stack):**
- Backend: Add queries/mutations to `convex/{feature}.ts`
- Schema: Add tables to `convex/schema.ts` if needed
- Component: Add to `src/components/{FeatureName}.tsx`
- Tests: Add `convex/{feature}.test.ts`

**New Component:**
- Implementation: `src/components/{ComponentName}.tsx`
- Follow pattern: Props interface, default export, no business logic

**New Page/Route:**
- Page: `src/pages/{PageName}.tsx`
- Route: Add to `src/App.tsx` Routes

**New Backend Function:**
- Queries/Mutations: `convex/{module}.ts`
- Actions (Node.js): `convex/actions/{action}.ts`
- Update test file: `convex/{module}.test.ts`

**Utilities:**
- Client-side: `src/lib/{utility}.ts`
- Server-side: `convex/{utility}.ts` (non-exported helpers)

**New E2E Test:**
- Add to `e2e/{flow}.spec.ts`
- Follow existing patterns (page object not used, inline selectors)

## Special Directories

**`convex/_generated/`:**
- Purpose: TypeScript types from Convex codegen
- Generated: Yes (on `convex dev` or `convex codegen`)
- Committed: Yes (for CI/deployment)

**`dist/`:**
- Purpose: Vite production build output
- Generated: Yes (on `npm run build`)
- Committed: No (gitignored)

**`.planning/`:**
- Purpose: Project planning and documentation
- Generated: No (manually maintained)
- Committed: Yes

**`playwright-report/` and `test-results/`:**
- Purpose: Test artifacts
- Generated: Yes (on test runs)
- Committed: No (gitignored)

---

*Structure analysis: 2026-01-16*

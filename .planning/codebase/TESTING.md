# Testing Patterns

**Analysis Date:** 2026-01-16

## Test Framework

**Unit/Integration Runner:**
- Vitest 4.0.17
- Config: `vitest.config.ts`

**E2E Runner:**
- Playwright 1.57.0
- Config: `playwright.config.ts`

**Backend Testing:**
- convex-test 0.0.41 (mocks Convex runtime)

**Assertion Library:**
- Vitest built-in expect (Jest-compatible)
- Playwright expect for E2E

**Run Commands:**
```bash
npm run test              # Run all unit tests (vitest run)
npm run test:watch        # Watch mode (vitest)
npm run test:e2e          # Run E2E tests (playwright test)
npm run test:e2e:ui       # Playwright UI mode
npm run test:all          # Run both unit and E2E tests
```

## Test File Organization

**Location:**
- Unit tests: Co-located in `convex/` directory for backend
- E2E tests: Separate `e2e/` directory
- Example/placeholder: `tests/example.test.ts`

**Naming:**
- Unit tests: `{module}.test.ts` (e.g., `sessions.test.ts`, `calculations.test.ts`)
- E2E tests: `{flow}.spec.ts` (e.g., `host-flow.spec.ts`, `join-flow.spec.ts`)

**Structure:**
```
/Users/osvi/src/split/
├── convex/
│   ├── sessions.ts
│   ├── sessions.test.ts      # Unit tests for sessions module
│   ├── items.ts
│   ├── items.test.ts         # Unit tests for items module
│   ├── claims.ts
│   ├── claims.test.ts        # Unit tests for claims module
│   ├── calculations.ts
│   ├── calculations.test.ts  # Pure function tests
│   ├── mutations.test.ts     # Additional mutation tests
│   └── test.setup.ts         # Test utilities
├── e2e/
│   ├── host-flow.spec.ts     # Host user journey E2E
│   └── join-flow.spec.ts     # Guest user journey E2E
└── tests/
    └── example.test.ts       # Placeholder
```

## Test Structure

**Suite Organization (Unit Tests):**
```typescript
import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

describe("sessions authorization", () => {
  describe("updateTip", () => {
    it("allows host to update tip (BTEST-03, BTEST-07)", async () => {
      const t = convexTest(schema);

      // Setup: Create session with host
      const { sessionId, hostParticipantId } = await t.run(async (ctx) => {
        const sessionId = await ctx.db.insert("sessions", { ... });
        const hostParticipantId = await ctx.db.insert("participants", { ... });
        return { sessionId, hostParticipantId };
      });

      // Action: Host updates tip
      await t.mutation(api.sessions.updateTip, { ... });

      // Verify: Session has updated tip settings
      const session = await t.run(async (ctx) => ctx.db.get(sessionId));
      expect(session?.tipType).toBe("percent_subtotal");
    });
  });
});
```

**Suite Organization (E2E Tests):**
```typescript
import { test, expect } from "@playwright/test";

test.describe("Host Flow", () => {
  test("E2E-01: can create bill and enter display name", async ({ page }) => {
    // 1. Navigate to home
    await page.goto("/");

    // 2. Enter name in input
    await page.fill("input#name", "Alice");

    // 3. Click button
    await page.click('button:has-text("Start Bill")');

    // 4. Wait for navigation
    await expect(page).toHaveURL(/\/bill\/[A-Z0-9]{6}/);
  });
});
```

**Patterns:**
- Setup/Action/Verify (AAA) pattern with explicit comments
- Test IDs in descriptions (e.g., `BTEST-03`, `E2E-01`) for traceability
- Nested `describe` blocks for grouping related tests
- Shared setup via `t.run()` blocks for database seeding

## Mocking

**Framework:** convex-test (for Convex backend)

**Patterns:**
```typescript
// Create isolated test context
const t = convexTest(schema);

// Seed test data directly via ctx.db
const { sessionId, hostParticipantId } = await t.run(async (ctx) => {
  const sessionId = await ctx.db.insert("sessions", {
    code: "ABC123",
    hostName: "Host",
    createdAt: Date.now(),
  });
  const hostParticipantId = await ctx.db.insert("participants", {
    sessionId,
    name: "Host",
    isHost: true,
    joinedAt: Date.now(),
  });
  return { sessionId, hostParticipantId };
});

// Call mutations/queries via api
await t.mutation(api.sessions.updateTip, {
  sessionId,
  participantId: hostParticipantId,
  tipType: "percent_subtotal",
  tipValue: 18,
});

// Verify state via ctx.db.get
const session = await t.run(async (ctx) => ctx.db.get(sessionId));
expect(session?.tipValue).toBe(18);
```

**What to Mock:**
- Database state (via `ctx.db.insert`)
- Each test gets isolated database context

**What NOT to Mock:**
- Actual mutation/query logic - test real implementations
- Convex validators - let them enforce types

## Fixtures and Factories

**Test Data:**
```typescript
// Inline factory pattern within t.run()
const { sessionId, participantId, itemId } = await t.run(async (ctx) => {
  const sessionId = await ctx.db.insert("sessions", {
    code: "ABC123",
    hostName: "Host",
    createdAt: Date.now(),
  });
  const participantId = await ctx.db.insert("participants", {
    sessionId,
    name: "Guest",
    isHost: false,
    joinedAt: Date.now(),
  });
  const itemId = await ctx.db.insert("items", {
    sessionId,
    name: "Burger",
    price: 1500,
    quantity: 1,
  });
  return { sessionId, participantId, itemId };
});
```

**Location:**
- No shared fixtures file - data created inline per test
- `convex/test.setup.ts` exports `convexTest` and `schema` for convenience

## Coverage

**Requirements:** None enforced (no coverage thresholds configured)

**View Coverage:**
```bash
# Not configured - add vitest --coverage if needed
```

## Test Types

**Unit Tests:**
- Scope: Individual Convex mutations, queries, and pure functions
- Files: `convex/*.test.ts`
- Focus: Authorization logic, validation, calculation correctness
- Run environment: Node (via vitest environmentMatchGlobs)

**Pure Function Tests:**
- Scope: Calculation functions with no side effects
- File: `convex/calculations.test.ts`
- Focus: Mathematical correctness, edge cases
- Example areas: Item share splitting, tax/tip calculations, remainder distribution

**Integration Tests:**
- Scope: Mutation flows that involve multiple tables
- Files: `convex/items.test.ts`, `convex/claims.test.ts`
- Focus: Cross-table operations like cascade deletes

**E2E Tests:**
- Scope: Full user journeys through the UI
- Files: `e2e/*.spec.ts`
- Framework: Playwright
- Focus: Host flow (create bill, add items, set tip, view summary), Guest flow (join, claim items)
- Browser: Chromium only (configured in `playwright.config.ts`)

## Common Patterns

**Async Testing:**
```typescript
it("allows host to update tip", async () => {
  const t = convexTest(schema);
  // All Convex operations are async
  await t.mutation(api.sessions.updateTip, { ... });
  const session = await t.run(async (ctx) => ctx.db.get(sessionId));
  expect(session?.tipValue).toBe(18);
});
```

**Error Testing:**
```typescript
it("rejects non-host updating tip", async () => {
  const t = convexTest(schema);
  // Setup with non-host participant...

  // Action & Verify: expect rejection
  await expect(
    t.mutation(api.sessions.updateTip, {
      sessionId,
      participantId: nonHostParticipantId,
      tipType: "percent_subtotal",
      tipValue: 18,
    })
  ).rejects.toThrow("Only the host can modify bill settings");
});
```

**E2E Multi-User Testing:**
```typescript
test("guest can join via session code", async ({ browser }) => {
  // Create isolated browser contexts for different users
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();

  try {
    // Host creates bill
    const { code } = await createBillAsHost(hostContext);

    // Guest joins with code
    const guestPage = await guestContext.newPage();
    await guestPage.goto("/");
    await guestPage.fill("input#code", code);
    await guestPage.click('button:has-text("Join Bill")');
    await expect(guestPage).toHaveURL(`/bill/${code}`);
  } finally {
    // Always cleanup contexts
    await hostContext.close();
    await guestContext.close();
  }
});
```

**Edge Case Testing:**
```typescript
describe("edge cases (BTEST-15)", () => {
  it("should return empty array for zero claimants", () => {
    expect(calculateItemShare(1000, 0)).toEqual([]);
  });

  it("should return 0 for zero group subtotal", () => {
    expect(calculateTaxShare(500, 0, 100)).toBe(0);
  });
});
```

## Vitest Configuration

**Key Settings from `vitest.config.ts`:**
```typescript
export default defineConfig({
  test: {
    environment: "edge-runtime",
    include: ["tests/**/*.test.ts", "convex/**/*.test.ts"],
    globals: true,
    environmentMatchGlobs: [
      ["convex/**/*.test.ts", "node"],  // convex-test requires node
    ],
    server: {
      deps: {
        inline: ["convex-test"],  // Required for module resolution
      },
    },
  },
});
```

## Playwright Configuration

**Key Settings from `playwright.config.ts`:**
```typescript
export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30000,
  },
});
```

## Test ID Conventions

Tests reference requirement IDs for traceability:
- `BTEST-*`: Backend test requirements
- `E2E-*`: End-to-end test requirements

Example: `it("allows host to update tip (BTEST-03, BTEST-07)", async () => { ... })`

---

*Testing analysis: 2026-01-16*

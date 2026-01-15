# Test Architecture Research

**Domain:** Convex Backend Testing + E2E Real-Time Sync Testing
**Researched:** 2026-01-15
**Confidence:** HIGH (based on official Convex docs and Playwright docs)

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Test Architecture                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌───────────────────────────┐    ┌───────────────────────────────────┐   │
│   │    Backend Unit Tests     │    │         E2E Tests                  │   │
│   │    (convex-test + Vitest) │    │     (Playwright + Browser)        │   │
│   └───────────────────────────┘    └───────────────────────────────────┘   │
│              │                                    │                          │
│              ▼                                    ▼                          │
│   ┌───────────────────────────┐    ┌───────────────────────────────────┐   │
│   │   Mock Convex Backend     │    │   Real Convex (Local or Staging)  │   │
│   │   - In-memory DB          │    │   - WebSocket connections         │   │
│   │   - Fast execution        │    │   - Multiple browser contexts     │   │
│   │   - Schema validation     │    │   - Real-time sync verification   │   │
│   └───────────────────────────┘    └───────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Recommended Project Structure

```
split/
├── convex/                         # Convex backend functions
│   ├── bills.ts                    # Mutations/queries
│   ├── participants.ts
│   ├── items.ts
│   ├── claims.ts
│   ├── schema.ts
│   ├── _generated/
│   │   └── api.d.ts
│   │
│   ├── bills.test.ts              # Co-located unit tests (RECOMMENDED)
│   ├── participants.test.ts       # Test file per function file
│   ├── items.test.ts
│   ├── claims.test.ts
│   ├── calculations.test.ts
│   │
│   └── testing/                    # Test utilities
│       └── testingFunctions.ts     # clearAll, test helpers
│
├── tests/                          # E2E tests (separate from convex/)
│   ├── fixtures/
│   │   ├── test.ts                # Custom Playwright fixtures
│   │   ├── host-user.ts           # Host user fixture
│   │   └── participant-user.ts    # Participant fixture
│   │
│   ├── e2e/
│   │   ├── host-flow.spec.ts      # Host creates bill, adds items
│   │   ├── join-flow.spec.ts      # Participant joins via code
│   │   ├── claim-flow.spec.ts     # Claiming items
│   │   ├── sync.spec.ts           # Real-time sync between users
│   │   └── receipt-upload.spec.ts # Receipt image processing
│   │
│   └── support/
│       ├── test-data.ts           # Test bill/item factories
│       └── wait-helpers.ts        # WebSocket wait utilities
│
├── vitest.config.ts               # Vitest config for unit tests
├── playwright.config.ts           # Playwright config for E2E
└── package.json
```

### Structure Rationale

- **convex/*.test.ts:** Co-located with source files for discoverability. Official convex-test docs recommend this pattern.
- **tests/e2e/:** Separate folder for E2E tests since they test full browser flows, not individual functions.
- **tests/fixtures/:** Playwright fixtures for multi-user browser context setup.

## Architectural Patterns

### Pattern 1: convex-test Unit Testing

**What:** Mock Convex backend for fast, isolated function testing
**When to use:** Testing business logic in mutations/queries
**Trade-offs:**
- Fast execution (no real backend needed)
- Does NOT test size/time limits, real runtime environment
- Mock may differ from real Convex behavior in edge cases
**Confidence:** HIGH (official Convex documentation)

**Example:**
```typescript
// convex/bills.test.ts
import { convexTest } from "convex-test";
import { test, expect } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

test("createBill generates unique code", async () => {
  const t = convexTest(schema);

  const billId = await t.mutation(api.bills.create, {
    hostName: "Alice"
  });

  const bill = await t.query(api.bills.get, { billId });
  expect(bill.code).toHaveLength(6);
  expect(bill.hostName).toBe("Alice");
});
```

### Pattern 2: Direct Database Fixtures with t.run()

**What:** Directly manipulate mock database for test setup
**When to use:** Setting up complex test state without calling mutations
**Trade-offs:** Faster setup, but bypasses mutation logic
**Confidence:** HIGH (official convex-test docs)

**Example:**
```typescript
test("calculateTotals with existing items", async () => {
  const t = convexTest(schema);

  // Direct fixture setup (bypasses mutations)
  const billId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("sessions", {
      code: "ABC123",
      hostName: "Alice",
      createdAt: Date.now(),
      subtotal: 5000,  // $50.00 in cents
      tax: 500,        // $5.00
    });

    await ctx.db.insert("items", {
      sessionId: id,
      name: "Burger",
      price: 1500,
      quantity: 1,
    });

    return id;
  });

  // Now test the calculation logic
  const totals = await t.query(api.calculations.getBillTotals, { billId });
  expect(totals.subtotal).toBe(5000);
});
```

### Pattern 3: Multi-User E2E with Browser Contexts

**What:** Playwright browser contexts for simulating multiple users
**When to use:** Testing real-time sync, collaborative features
**Trade-offs:** Slower than unit tests, but tests full WebSocket sync
**Confidence:** HIGH (official Playwright docs)

**Example:**
```typescript
// tests/e2e/sync.spec.ts
import { test, expect } from '@playwright/test';

test('items sync between host and participant', async ({ browser }) => {
  // Create isolated contexts for each user
  const hostContext = await browser.newContext();
  const participantContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const participantPage = await participantContext.newPage();

  // Host creates bill
  await hostPage.goto('/');
  await hostPage.fill('[data-testid="host-name"]', 'Alice');
  await hostPage.click('[data-testid="create-bill"]');

  // Get share code
  const code = await hostPage.textContent('[data-testid="bill-code"]');

  // Participant joins
  await participantPage.goto('/');
  await participantPage.fill('[data-testid="join-code"]', code);
  await participantPage.fill('[data-testid="participant-name"]', 'Bob');
  await participantPage.click('[data-testid="join-bill"]');

  // Host adds item
  await hostPage.fill('[data-testid="item-name"]', 'Pizza');
  await hostPage.fill('[data-testid="item-price"]', '15.00');
  await hostPage.click('[data-testid="add-item"]');

  // Verify participant sees item (real-time sync!)
  await expect(participantPage.locator('[data-testid="item-name"]'))
    .toContainText('Pizza', { timeout: 5000 });

  // Cleanup
  await hostContext.close();
  await participantContext.close();
});
```

### Pattern 4: Custom Playwright Fixtures for User Types

**What:** Reusable fixtures for host and participant users
**When to use:** When many tests need the same user setup
**Trade-offs:** More setup code, but cleaner tests
**Confidence:** HIGH (official Playwright fixture docs)

**Example:**
```typescript
// tests/fixtures/test.ts
import { test as base, Page, BrowserContext } from '@playwright/test';

type SplitFixtures = {
  hostPage: Page;
  hostContext: BrowserContext;
  participantPage: Page;
  participantContext: BrowserContext;
  billCode: string;
};

export const test = base.extend<SplitFixtures>({
  hostContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  hostPage: async ({ hostContext }, use) => {
    const page = await hostContext.newPage();
    await page.goto('/');
    await page.fill('[data-testid="host-name"]', 'TestHost');
    await page.click('[data-testid="create-bill"]');
    await use(page);
  },

  billCode: async ({ hostPage }, use) => {
    const code = await hostPage.textContent('[data-testid="bill-code"]');
    await use(code!);
  },

  participantContext: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },

  participantPage: async ({ participantContext, billCode }, use) => {
    const page = await participantContext.newPage();
    await page.goto('/');
    await page.fill('[data-testid="join-code"]', billCode);
    await page.fill('[data-testid="participant-name"]', 'TestParticipant');
    await page.click('[data-testid="join-bill"]');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

**Usage:**
```typescript
// tests/e2e/claim-flow.spec.ts
import { test, expect } from '../fixtures/test';

test('participant can claim item added by host', async ({ hostPage, participantPage }) => {
  // Both users already set up by fixtures!

  // Host adds item
  await hostPage.fill('[data-testid="item-name"]', 'Salad');
  await hostPage.fill('[data-testid="item-price"]', '12.00');
  await hostPage.click('[data-testid="add-item"]');

  // Participant claims it
  await participantPage.click('[data-testid="claim-salad"]');

  // Verify claim shows for both
  await expect(hostPage.locator('[data-testid="salad-claimed-by"]'))
    .toContainText('TestParticipant');
});
```

## Data Flow

### Unit Test Flow (convex-test)

```
Test Code
    │
    ▼
convexTest(schema) ──► Mock Convex Backend
    │                       │
    │                       ▼
    │               In-Memory Database
    │                       │
    ▼                       ▼
t.mutation() ────────► Execute Handler ────► Modify Mock DB
    │                                             │
    ▼                                             ▼
t.query() ───────────► Execute Handler ────► Read Mock DB
    │
    ▼
expect(result)
```

### E2E Test Flow (Playwright + Real Convex)

```
┌────────────────┐     ┌────────────────┐
│   Host Page    │     │ Participant    │
│   (Context 1)  │     │   (Context 2)  │
└───────┬────────┘     └───────┬────────┘
        │                      │
        │ WebSocket            │ WebSocket
        │                      │
        ▼                      ▼
┌─────────────────────────────────────────┐
│        Convex Backend                    │
│   (Local dev or staging deployment)      │
│                                          │
│   ┌──────────────────────────────────┐  │
│   │          Database                 │  │
│   │  - sessions                       │  │
│   │  - participants                   │  │
│   │  - items                          │  │
│   │  - claims                         │  │
│   └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
        │
        │ Real-time subscriptions push
        │ updates to BOTH browser contexts
        │
        ▼
┌────────────────┐     ┌────────────────┐
│  Host sees     │     │ Participant    │
│  participant   │     │ sees items     │
│  claims        │     │ appear         │
└────────────────┘     └────────────────┘
```

## Test Data Setup & Teardown

### Pattern A: convex-test (Each Test Gets Fresh Mock)

```typescript
// Each convexTest() call creates a fresh, empty mock database
// No explicit teardown needed!

test("test 1", async () => {
  const t = convexTest(schema);  // Fresh DB
  // ... test ...
});  // Mock discarded

test("test 2", async () => {
  const t = convexTest(schema);  // Another fresh DB
  // ... test ...
});
```
**Confidence:** HIGH

### Pattern B: Local Backend (clearAll between tests)

For tests against real local backend:

```typescript
// convex/testing/testingFunctions.ts
import { internalMutation } from "../_generated/server";

// ONLY callable when IS_TEST env var is set
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear all tables
    for (const table of ["sessions", "participants", "items", "claims"]) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
    }

    // Cancel scheduled functions
    const scheduled = await ctx.db.system.query("_scheduled_functions").collect();
    for (const fn of scheduled) {
      await ctx.scheduler.cancel(fn._id);
    }

    // Delete stored files
    const files = await ctx.db.system.query("_storage").collect();
    for (const file of files) {
      await ctx.storage.delete(file._id);
    }
  },
});
```

**Test usage:**
```typescript
import { ConvexTestingHelper } from "convex-helpers/testing";

describe("bills", () => {
  let t: ConvexTestingHelper;

  beforeEach(() => {
    t = new ConvexTestingHelper();
  });

  afterEach(async () => {
    await t.mutation(api.testing.testingFunctions.clearAll, {});
    await t.close();
  });

  test("create bill", async () => {
    // ... test against real local backend
  });
});
```
**Confidence:** MEDIUM (pattern from convex-helpers example, but requires local backend setup)

### Pattern C: E2E Test Data Isolation

For E2E tests, each test creates its own bill with unique code:

```typescript
test.beforeEach(async ({ page }) => {
  // Each test creates a fresh bill
  // No cleanup needed - bills isolated by unique codes
});

// OR use database cleanup via API if needed
test.afterEach(async ({ request }) => {
  // Call test cleanup endpoint if available
  await request.post('/api/test/cleanup', {
    data: { testId: testInfo.testId }
  });
});
```
**Confidence:** MEDIUM (common pattern, but specific implementation varies)

## Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "edge-runtime",  // Matches Convex runtime better
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
    include: ["convex/**/*.test.ts"],
  },
});
```
**Confidence:** HIGH (from official convex-test docs)

## Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail build on CI if test.only left in
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Limit workers on CI
  workers: process.env.CI ? 1 : undefined,

  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Use data-testid for selectors
    testIdAttribute: 'data-testid',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile viewport for responsive testing
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // Start dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```
**Confidence:** HIGH (standard Playwright config)

## Testing Real-Time Sync

### Verifying WebSocket Updates

```typescript
test('real-time item sync', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const participantContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const participantPage = await participantContext.newPage();

  // Setup both users on same bill...

  // Host adds item
  await hostPage.fill('[data-testid="item-name"]', 'Burger');
  await hostPage.click('[data-testid="add-item"]');

  // Wait for real-time sync to participant
  // Playwright's auto-waiting handles WebSocket updates
  await expect(participantPage.locator('text=Burger'))
    .toBeVisible({ timeout: 5000 });
});
```

### Listening to WebSocket Events (Advanced)

```typescript
test('capture WebSocket messages', async ({ page }) => {
  // Listen for WebSocket creation
  page.on('websocket', (ws) => {
    console.log(`WebSocket opened: ${ws.url()}`);

    ws.on('framereceived', (data) => {
      console.log('Received:', data.payload);
    });

    ws.on('framesent', (data) => {
      console.log('Sent:', data.payload);
    });
  });

  await page.goto('/');
  // ... test actions
});
```
**Confidence:** HIGH (official Playwright WebSocket docs)

## Anti-Patterns

### Anti-Pattern 1: Testing Convex Functions via HTTP

**What people do:** Call Convex functions via HTTP client in tests
**Why it's wrong:** Bypasses real-time subscriptions, slower, requires deployed backend
**Do this instead:** Use convex-test for unit tests, browser contexts for E2E

### Anti-Pattern 2: Shared Test State Between Tests

**What people do:** Reuse database state from previous tests
**Why it's wrong:** Tests become order-dependent, flaky failures
**Do this instead:** Each test creates fresh state or uses clearAll between tests

### Anti-Pattern 3: Hardcoded Test Data IDs

**What people do:** Use hardcoded document IDs in assertions
**Why it's wrong:** IDs are generated, will differ between runs
**Do this instead:** Query for documents by properties, use returned IDs from mutations

### Anti-Pattern 4: Single Browser Context for Multi-User Tests

**What people do:** Use same browser context for host and participant
**Why it's wrong:** Shared localStorage/cookies, doesn't test real isolation
**Do this instead:** Create separate browser contexts for each user

## Sources

### Official Documentation (HIGH confidence)
- [Convex Testing Overview](https://docs.convex.dev/testing) - Main testing guide
- [convex-test Library](https://docs.convex.dev/testing/convex-test) - Mock backend testing
- [Testing with Local OSS Backend](https://stack.convex.dev/testing-with-local-oss-backend) - Real backend testing
- [Playwright Browser Contexts](https://playwright.dev/docs/browser-contexts) - Multi-user isolation
- [Playwright WebSocket API](https://playwright.dev/docs/api/class-websocket) - WebSocket testing

### Community Resources (MEDIUM confidence)
- [convex-helpers GitHub](https://github.com/get-convex/convex-helpers) - Testing utilities
- [convex-test GitHub](https://github.com/get-convex/convex-test) - Mock implementation
- [Testing Patterns Article](https://stack.convex.dev/testing-patterns) - Best practices

### Playwright Patterns (HIGH confidence)
- [Playwright Isolation Docs](https://playwright.dev/docs/browser-contexts)
- [Playwright Fixtures](https://www.browserstack.com/guide/fixtures-in-playwright)
- [Multi-User Testing with Fixtures](https://dev.to/gustavomeilus/scaling-your-playwright-tests-a-fixture-for-multi-user-multi-context-worlds-53i4) (MEDIUM)

---
*Architecture research for: Convex + Playwright Testing*
*Researched: 2026-01-15*

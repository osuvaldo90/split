# Stack Research: Testing Infrastructure

**Domain:** Testing for Convex + React + Vite Real-time Collaborative App
**Researched:** 2026-01-15
**Confidence:** HIGH (based on official Convex docs + verified npm packages)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Vitest** | ^3.0.0 | Test runner | Official Convex recommendation; native Vite integration shares config; 10-20x faster than Jest in watch mode; native ESM/TypeScript support |
| **convex-test** | ^0.0.41 | Convex function testing | Official Convex library; mock backend for fast unit tests; supports schema validation, auth testing, scheduled functions |
| **Playwright** | ^1.50.0 | E2E browser testing | WebSocket-based architecture ideal for real-time apps; native WebSocket interception (v1.48+); 4x faster than Cypress in cross-browser |
| **@edge-runtime/vm** | latest | Vitest environment | Required by convex-test; emulates Convex runtime environment |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@testing-library/react** | ^16.3.1 | React component testing | Testing React components with Convex hooks; requires @testing-library/dom peer dep |
| **@testing-library/dom** | ^10.0.0 | DOM testing utilities | Required peer dependency for @testing-library/react v16+ |
| **convex-helpers** | ^0.1.107 | Testing utilities | Provides `ConvexReactClientFake` for React component testing with mocked Convex client |
| **happy-dom** | latest | DOM environment | Alternative to jsdom for React tests; faster but less complete API coverage |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **@playwright/test** | Playwright test runner | Includes built-in assertions, parallel execution, trace viewer |
| **@vitest/coverage-v8** | Code coverage | Vitest's native coverage provider using V8 |

## Installation

```bash
# Core testing infrastructure
npm install -D vitest convex-test @edge-runtime/vm

# React component testing
npm install -D @testing-library/react @testing-library/dom convex-helpers

# E2E testing
npm install -D @playwright/test

# Optional: Coverage
npm install -D @vitest/coverage-v8
```

## Configuration

### vitest.config.ts

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Multiple environments for different test types
    environmentMatchGlobs: [
      ["convex/**/*.test.ts", "edge-runtime"],  // Convex function tests
      ["src/**/*.test.tsx", "happy-dom"],        // React component tests
    ],
    server: {
      deps: {
        inline: ["convex-test"],
      },
    },
    // Recommended scripts
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
```

### package.json scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:once": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Patterns

### Convex Function Unit Test (convex-test)

```typescript
// convex/bills.test.ts
import { convexTest } from "convex-test";
import { expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

test("createBill requires authentication", async () => {
  const t = convexTest(schema, modules);

  // Unauthenticated call should fail
  await expect(
    t.mutation(api.bills.create, { name: "Test Bill" })
  ).rejects.toThrow();

  // Authenticated call should succeed
  const asUser = t.withIdentity({ name: "Test User" });
  const billId = await asUser.mutation(api.bills.create, { name: "Test Bill" });
  expect(billId).toBeDefined();
});

test("calculateTotal returns correct sum", async () => {
  const t = convexTest(schema, modules);
  const asHost = t.withIdentity({ name: "Host" });

  // Create bill and add items
  const billId = await asHost.mutation(api.bills.create, { name: "Dinner" });
  await asHost.mutation(api.items.add, { billId, name: "Pizza", price: 1500 });
  await asHost.mutation(api.items.add, { billId, name: "Salad", price: 800 });

  // Query calculation
  const bill = await asHost.query(api.bills.get, { billId });
  expect(bill.total).toBe(2300);
});
```

### React Component Test (with ConvexReactClientFake)

```typescript
// src/components/BillSummary.test.tsx
import { render, screen } from "@testing-library/react";
import { ConvexProvider } from "convex/react";
import { ConvexReactClientFake } from "convex-helpers/react/ConvexReactClientFake";
import { expect, test } from "vitest";
import { BillSummary } from "./BillSummary";

test("displays bill total", async () => {
  const fakeClient = new ConvexReactClientFake({
    queries: {
      "bills:get": () => ({
        _id: "test-bill-id",
        name: "Test Bill",
        total: 2500,
        items: [],
      }),
    },
  });

  render(
    <ConvexProvider client={fakeClient}>
      <BillSummary billId="test-bill-id" />
    </ConvexProvider>
  );

  expect(await screen.findByText("$25.00")).toBeInTheDocument();
});
```

### E2E Test (Playwright with WebSocket)

```typescript
// e2e/bill-flow.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Host creates bill, participant joins", () => {
  test("real-time sync between host and participant", async ({ browser }) => {
    // Host context
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    // Participant context (different session)
    const participantContext = await browser.newContext();
    const participantPage = await participantContext.newPage();

    // Host creates bill
    await hostPage.goto("/");
    await hostPage.getByRole("button", { name: /new bill/i }).click();
    await hostPage.getByLabel(/bill name/i).fill("Dinner Split");
    await hostPage.getByRole("button", { name: /create/i }).click();

    // Get share code
    const shareCode = await hostPage.getByTestId("share-code").textContent();

    // Participant joins
    await participantPage.goto(`/join/${shareCode}`);
    await participantPage.getByLabel(/your name/i).fill("Alice");
    await participantPage.getByRole("button", { name: /join/i }).click();

    // Verify participant sees bill
    await expect(participantPage.getByText("Dinner Split")).toBeVisible();

    // Host adds item - participant sees it in real-time
    await hostPage.getByRole("button", { name: /add item/i }).click();
    await hostPage.getByLabel(/item name/i).fill("Pizza");
    await hostPage.getByLabel(/price/i).fill("15.00");
    await hostPage.getByRole("button", { name: /save/i }).click();

    // Real-time sync: participant should see item without refresh
    await expect(participantPage.getByText("Pizza")).toBeVisible({ timeout: 5000 });
    await expect(participantPage.getByText("$15.00")).toBeVisible();

    // Cleanup
    await hostContext.close();
    await participantContext.close();
  });
});

test("WebSocket intercept for testing sync failures", async ({ page }) => {
  // Mock WebSocket to test offline/reconnection scenarios
  await page.routeWebSocket(/convex/, (ws) => {
    ws.onMessage((message) => {
      // Can intercept, modify, or block messages
      ws.send(message); // Forward to server
    });
  });

  await page.goto("/");
  // Test continues...
});
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Vitest** | Jest | Legacy projects already using Jest; migration cost not justified |
| **convex-test** | Local OSS backend | Need full backend fidelity; testing cron jobs; testing size/time limits |
| **Playwright** | Cypress | Team familiar with Cypress; simpler single-domain tests; prefer in-browser debugging |
| **happy-dom** | jsdom | Need more complete browser API simulation; using byRole queries heavily |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Jest** (for new Vite projects) | Requires separate config; slower; no native ESM support | Vitest |
| **@testing-library/react-hooks** | Deprecated; merged into @testing-library/react v13+ | @testing-library/react |
| **Local Convex backend** (for unit tests) | Slower; more complex setup; overkill for most unit tests | convex-test |
| **Cypress** (for WebSocket-heavy apps) | WebSocket support is limited; slower cross-browser | Playwright |

## Stack Patterns by Variant

**For Convex Function Testing:**
- Use `convex-test` with `edge-runtime` environment
- Mock auth with `t.withIdentity()`
- Use `vi.useFakeTimers()` for scheduled function tests
- Direct DB access via `t.run()` for test setup

**For React Component Testing:**
- Use `ConvexReactClientFake` from convex-helpers
- Environment: `happy-dom` or `jsdom`
- Mock queries/mutations at the client level

**For E2E Real-time Testing:**
- Use Playwright's multi-context for simulating multiple users
- Leverage `page.routeWebSocket()` for network condition testing
- Use `expect.toBeVisible({ timeout })` for real-time sync assertions

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| convex-test@^0.0.41 | vitest@^3.0.0 | Requires @edge-runtime/vm |
| convex-test@^0.0.41 | convex@^1.31.4 | Match major Convex version |
| @testing-library/react@^16.0.0 | react@^18.0.0 or ^19.0.0 | Requires @testing-library/dom as peer |
| vitest@^3.0.0 | vite@^5.0.0 or ^6.0.0 or ^7.0.0 | Shares Vite config |
| playwright@^1.50.0 | Node.js@^18.0.0 | WebSocket routing requires v1.48+ |

## Limitations & Caveats

### convex-test Limitations (from official docs)
- No size/time limit enforcement (unlike production)
- Text search returns all documents with matching word prefix (simplified)
- Vector search uses cosine similarity but no efficient index
- No cron job support (trigger manually in tests)
- Generated IDs differ from production format
- Error messages may differ from production

### Testing Strategy Recommendation (from Convex)
> "Attitudes like aiming for 100% code coverage, or going through the motions of writing meaningless unit tests, often don't do much to improve the actual correctness of a system despite consuming a lot of engineering effort."

Focus on:
1. Authorization logic (who can access what)
2. Calculation correctness (bill splitting math)
3. Critical user flows (host flow, join flow, real-time sync)
4. Edge cases in business logic

## Sources

- [Convex Testing Documentation](https://docs.convex.dev/testing) - Official testing overview (HIGH confidence)
- [convex-test Documentation](https://docs.convex.dev/testing/convex-test) - Setup and API reference (HIGH confidence)
- [convex-test npm](https://www.npmjs.com/package/convex-test) - Package version 0.0.41 (HIGH confidence)
- [Testing React Components with Convex](https://stack.convex.dev/testing-react-components-with-convex) - ConvexReactClientFake patterns (HIGH confidence)
- [convex-helpers GitHub](https://github.com/get-convex/convex-helpers) - ConvexReactClientFake source (HIGH confidence)
- [Vitest 3.0 Release](https://vitest.dev/blog/vitest-3) - Vitest 3.0 features, January 2025 (HIGH confidence)
- [Vitest vs Jest Comparison](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/) - Performance benchmarks (MEDIUM confidence)
- [Playwright Documentation](https://playwright.dev/) - Official docs (HIGH confidence)
- [Playwright WebSocketRoute](https://playwright.dev/docs/api/class-websocketroute) - WebSocket interception API (HIGH confidence)
- [Playwright vs Cypress 2025](https://www.frugaltesting.com/blog/playwright-vs-cypress-the-ultimate-2025-e2e-testing-showdown) - Comparison article (MEDIUM confidence)
- [@testing-library/react npm](https://www.npmjs.com/package/@testing-library/react) - Version 16.3.1 (HIGH confidence)
- [happy-dom vs jsdom Discussion](https://github.com/vitest-dev/vitest/discussions/1607) - Performance comparison (MEDIUM confidence)

---
*Stack research for: Testing Infrastructure - Convex + React + Vite*
*Researched: 2026-01-15*

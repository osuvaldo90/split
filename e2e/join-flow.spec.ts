import { test, expect } from "@playwright/test";

test.describe("Join Flow", () => {
  // Helper to create a bill and extract the code
  async function createBillAsHost(
    hostContext: Awaited<ReturnType<typeof test.info>["project"]["use"]["browser"]["newContext"]>
  ): Promise<{ page: Awaited<ReturnType<typeof hostContext.newPage>>; code: string }> {
    const hostPage = await hostContext.newPage();
    await hostPage.goto("/");
    await hostPage.fill("input#name", "Host");
    await hostPage.click('button:has-text("Start Bill")');
    await expect(hostPage).toHaveURL(/\/bill\/([A-Z0-9]{6})/);

    // Extract code from URL
    const url = hostPage.url();
    const match = url.match(/\/bill\/([A-Z0-9]{6})/);
    const code = match ? match[1] : "";
    expect(code).toHaveLength(6);

    return { page: hostPage, code };
  }

  test("E2E-05: guest can join via session code", async ({ browser }) => {
    // Create two isolated browser contexts
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    try {
      // 1. Host creates a bill
      const { code } = await createBillAsHost(hostContext);

      // 2. Guest navigates to home
      const guestPage = await guestContext.newPage();
      await guestPage.goto("/");

      // 3. Guest enters the session code
      await guestPage.fill("input#code", code);

      // 4. Wait for "Bill found!" message
      await expect(guestPage.locator("text=Bill found!")).toBeVisible();

      // 5. Guest enters their name
      await guestPage.fill("input#name", "Guest");

      // 6. Click "Join Bill"
      await guestPage.click('button:has-text("Join Bill")');

      // 7. Verify navigation to session page
      await expect(guestPage).toHaveURL(`/bill/${code}`);
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test("E2E-06: guest can enter display name", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    try {
      const { code } = await createBillAsHost(hostContext);

      const guestPage = await guestContext.newPage();
      // Navigate directly to bill URL without joining
      await guestPage.goto(`/bill/${code}`);

      // JoinGate should be shown
      await expect(guestPage.locator("text=Join this bill")).toBeVisible();

      // Enter name in JoinGate
      await guestPage.fill("input#join-name", "Alice");

      // Click Join Bill
      await guestPage.click('button:has-text("Join Bill")');

      // Verify joined - should see the Items tab content
      await expect(guestPage.locator("text=Who's Here")).toBeVisible();

      // Verify Alice appears in participants list (use first() for strict mode)
      await expect(guestPage.locator("text=Alice").first()).toBeVisible();
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});

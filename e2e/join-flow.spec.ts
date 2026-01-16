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

  test("E2E-07: guest can claim items", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    try {
      // 1. Host creates bill and adds an item
      const { page: hostPage, code } = await createBillAsHost(hostContext);

      // Host adds an item
      await hostPage.click('button:has-text("+ Add Item")');
      await hostPage.fill('input[placeholder="Item name"]', "Pizza");
      await hostPage.fill('input[inputmode="decimal"]', "15.00");
      await hostPage.click('button:has-text("Save")');
      await expect(hostPage.locator("text=Pizza")).toBeVisible();

      // 2. Guest joins the bill
      const guestPage = await guestContext.newPage();
      await guestPage.goto(`/bill/${code}`);
      await guestPage.fill("input#join-name", "Bob");
      await guestPage.click('button:has-text("Join Bill")');

      // 3. Wait for items to load - verify "Tap to claim" hint is visible
      const pizzaItem = guestPage.locator(".rounded-lg").filter({ hasText: "Pizza" });
      await expect(pizzaItem).toBeVisible();
      await expect(pizzaItem.locator("text=Tap to claim")).toBeVisible();

      // 4. Claim the item (click on the item container)
      await pizzaItem.click();

      // 5. Verify claim indicator appears - Bob's name should be in a pill
      await expect(pizzaItem.locator("text=Bob")).toBeVisible();
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });

  test("E2E-08: guest can see updated totals after claiming", async ({
    browser,
  }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    try {
      // 1. Host creates bill and adds an item
      const { page: hostPage, code } = await createBillAsHost(hostContext);

      await hostPage.click('button:has-text("+ Add Item")');
      await hostPage.fill('input[placeholder="Item name"]', "Pasta");
      await hostPage.fill('input[inputmode="decimal"]', "20.00");
      await hostPage.click('button:has-text("Save")');
      await expect(hostPage.locator("text=Pasta")).toBeVisible();

      // 2. Guest joins and claims
      const guestPage = await guestContext.newPage();
      await guestPage.goto(`/bill/${code}`);
      await guestPage.fill("input#join-name", "Carol");
      await guestPage.click('button:has-text("Join Bill")');

      // Wait for the item to load - verify "Tap to claim" hint is visible
      const pastaItem = guestPage
        .locator(".rounded-lg")
        .filter({ hasText: "Pasta" })
        .filter({ hasText: "Tap to claim" });
      await expect(pastaItem).toBeVisible();

      // Claim the item
      await pastaItem.click();

      // Wait for claim to be processed (Carol's name appears in pill)
      await expect(
        guestPage
          .locator(".rounded-lg")
          .filter({ hasText: "Pasta" })
          .locator("text=Carol")
      ).toBeVisible();

      // 3. Navigate to Summary tab
      await guestPage.click('button:has-text("Summary")');

      // 4. Verify Carol's participant card shows with correct total
      // Carol's card should have $20.00 (font-bold for total)
      const carolCard = guestPage.locator(".rounded-lg.border-2").filter({ hasText: "Carol" });
      await expect(carolCard).toBeVisible();

      // 5. Verify the total includes $20.00 (the claimed item)
      await expect(carolCard.locator("text=$20.00").first()).toBeVisible();
    } finally {
      await hostContext.close();
      await guestContext.close();
    }
  });
});

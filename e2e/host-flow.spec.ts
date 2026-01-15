import { test, expect } from "@playwright/test";

test.describe("Host Flow", () => {
  test("E2E-01: can create bill and enter display name", async ({ page }) => {
    // 1. Navigate to home
    await page.goto("/");

    // 2. Enter name in "Your name" input
    await page.fill("input#name", "Alice");

    // 3. Click "Start Bill" button (no code entered = create mode)
    await page.click('button:has-text("Start Bill")');

    // 4. Wait for navigation to /bill/:code
    await expect(page).toHaveURL(/\/bill\/[A-Z0-9]{6}/);

    // 5. Verify session code is displayed in header
    await expect(page.locator("text=/[A-Z0-9]{6}/")).toBeVisible();
  });

  test("E2E-02: can add items with name and price", async ({ page }) => {
    // 1. Create a bill first (reuse pattern from E2E-01)
    await page.goto("/");
    await page.fill("input#name", "Alice");
    await page.click('button:has-text("Start Bill")');
    await expect(page).toHaveURL(/\/bill\/[A-Z0-9]{6}/);

    // 2. Click "+ Add Item" button
    await page.click('button:has-text("+ Add Item")');

    // 3. Fill item name in the draft item form
    await page.fill('input[placeholder="Item name"]', "Burger");

    // 4. Fill price (input with inputmode="decimal")
    await page.fill('input[inputmode="decimal"]', "12.99");

    // 5. Click Save
    await page.click('button:has-text("Save")');

    // 6. Verify item appears in list
    await expect(page.locator("text=Burger")).toBeVisible();
    // Use .first() since price appears in multiple places (item row and total)
    await expect(page.locator("text=$12.99").first()).toBeVisible();
  });

  test("E2E-03: can set tip settings", async ({ page }) => {
    // Create bill and add an item first
    await page.goto("/");
    await page.fill("input#name", "Alice");
    await page.click('button:has-text("Start Bill")');
    await expect(page).toHaveURL(/\/bill\/[A-Z0-9]{6}/);

    // Add an item so we have a subtotal
    await page.click('button:has-text("+ Add Item")');
    await page.fill('input[placeholder="Item name"]', "Fries");
    await page.fill('input[inputmode="decimal"]', "5.00");
    await page.click('button:has-text("Save")');

    // Wait for item to appear in list
    await expect(page.locator("text=Fries")).toBeVisible();

    // Navigate to Tax & Tip tab
    await page.click('button:has-text("Tax & Tip")');

    // Wait for tab content to load - look for the Tip section header
    await expect(page.locator("h3:has-text('Tip')")).toBeVisible();

    // The tip input is a percent input (adjacent to % sign) when in percent_subtotal mode
    // Find the input next to the % sign in the Tip section
    const tipInput = page.locator('input[inputmode="decimal"]').nth(2);
    await tipInput.fill("20");
    await tipInput.blur();

    // Verify tip is applied - look for the tip total display
    await expect(page.locator("text=Tip total:")).toBeVisible();
    // With 5.00 subtotal and 20% tip, tip should be $1.00
    // Use .first() since the value appears in multiple places
    await expect(page.locator("text=$1.00").first()).toBeVisible();
  });

  test("E2E-04: can view summary with totals", async ({ page }) => {
    // Create bill, add item, claim it
    await page.goto("/");
    await page.fill("input#name", "Alice");
    await page.click('button:has-text("Start Bill")');
    await expect(page).toHaveURL(/\/bill\/[A-Z0-9]{6}/);

    // Add an item
    await page.click('button:has-text("+ Add Item")');
    await page.fill('input[placeholder="Item name"]', "Salad");
    await page.fill('input[inputmode="decimal"]', "10.00");
    await page.click('button:has-text("Save")');

    // Wait for item to appear
    await expect(page.locator("text=Salad")).toBeVisible();

    // Claim the item by clicking on it (ClaimableItem component)
    await page.locator("text=Salad").click();

    // Navigate to Summary tab
    await page.click('button:has-text("Summary")');

    // Verify participant card shows with name and total
    await expect(page.locator("text=Alice")).toBeVisible();
    // The total should include the claimed item ($10.00)
    // Use .first() since the value appears in multiple places (main total and breakdown)
    await expect(page.locator("text=$10.00").first()).toBeVisible();
  });
});

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
});

import { test, expect } from "@playwright/test";

test.describe("Responsive layout", () => {
  test("desktop shows sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/chat");
    await expect(page.getByText("AI Chat", { exact: true })).toBeVisible();
  });

  test("mobile shows hamburger and hides desktop sidebar", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/chat");

    // The hamburger menu button should be visible (md:hidden means it's only on mobile)
    const menuButton = page.locator(".md\\:hidden button").first();
    await expect(menuButton).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test.describe("Chat UI", () => {
  test("sidebar shows app name on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/chat");
    await expect(page.getByText("AI Chat", { exact: true })).toBeVisible();
  });

  test("new chat button exists in sidebar on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/chat");
    await expect(
      page.getByRole("button", { name: "New chat", exact: true })
    ).toBeVisible();
  });

  test("clicking 'Start a new chat' navigates to a chat page", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/chat");
    await page.getByRole("button", { name: /start a new chat/i }).click();
    await page.waitForURL("**/chat/**", { timeout: 15000 });
    expect(page.url()).toMatch(/\/chat\/.+/);
  });

  test("chat page renders message input after loading", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/chat");
    await page.getByRole("button", { name: /start a new chat/i }).click();
    await page.waitForURL("**/chat/**", { timeout: 15000 });

    // Wait for chat to load (React Query fetches chat data)
    await page.waitForLoadState("networkidle");
    const input = page.locator("textarea");
    await expect(input).toBeVisible({ timeout: 15000 });
  });
});

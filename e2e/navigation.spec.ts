import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("home page redirects to /chat", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/chat");
    expect(page.url()).toContain("/chat");
  });

  test("chat page shows welcome screen", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByText("Welcome to AI Chat")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /start a new chat/i })
    ).toBeVisible();
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /sign in/i })
    ).toBeVisible();
  });

  test("signup page is accessible", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("button", { name: /sign up/i })
    ).toBeVisible();
  });
});

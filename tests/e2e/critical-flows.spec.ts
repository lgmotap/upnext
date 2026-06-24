import { test, expect } from "@playwright/test";

test.describe("Legal", () => {
  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible();
  });
});

test.describe("Marketing", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Auth", () => {
  test("sign-in page loads", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });
});

test.describe("Public booking", () => {
  test("booking page loads for smoke-test-co slug", async ({ page }) => {
    await page.goto("/book/smoke-test-co");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Product shell", () => {
  test("unauthenticated /app redirects to sign-in", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });
});

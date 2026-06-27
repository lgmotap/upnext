import { test, expect } from "@playwright/test";

test.describe("Legal", () => {
  test("privacy page loads with entity and contact", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();
    await expect(page.getByText("Registry code: 17395646")).toBeVisible();
    await expect(page.getByRole("link", { name: "privacy@bookedfox.com" }).first()).toBeVisible();
    await expect(page.getByText(/hello@example\.com/i)).toHaveCount(0);
  });

  test("terms page loads with entity and contact", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByRole("heading", { name: /terms of service/i })).toBeVisible();
    await expect(page.getByText("Registry code: 17395646")).toBeVisible();
    await expect(page.getByRole("link", { name: "hello@bookedfox.com" }).first()).toBeVisible();
    await expect(page.getByText(/hello@example\.com/i)).toHaveCount(0);
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

  test("crew route does not redirect to owner sign-in", async ({ page }) => {
    await page.goto("/crew");
    await expect(page).not.toHaveURL(/\/app\//);
  });
});

test.describe("Public booking embed", () => {
  test("embed route loads for smoke-test-co", async ({ page }) => {
    await page.goto("/book/smoke-test-co/embed");
    await expect(page.getByText(/book online|choose your service/i).first()).toBeVisible();
  });
});

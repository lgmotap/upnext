import { test, expect } from "@playwright/test";

/**
 * Extended route coverage beyond critical-flows.spec.ts.
 * Authenticated owner flow runs only when E2E_OWNER_EMAIL + E2E_OWNER_PASSWORD are set.
 */
const ownerEmail = process.env.E2E_OWNER_EMAIL;
const ownerPassword = process.env.E2E_OWNER_PASSWORD;
const bookingSlug = process.env.E2E_BOOKING_SLUG ?? "smoke-test-co";

test.describe("Full product — public surfaces", () => {
  test("public booking loads services", async ({ page }) => {
    await page.goto(`/book/${bookingSlug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("customer portal entry loads", async ({ page }) => {
    await page.goto(`/my/${bookingSlug}`);
    await expect(page.getByText(/customer portal|sign in|magic link/i).first()).toBeVisible();
  });

  test("team availability route requires auth", async ({ page }) => {
    await page.goto("/app/team");
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe("Full product — authenticated owner", () => {
  test.skip(!ownerEmail || !ownerPassword, "Set E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD");

  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(ownerEmail!);
    await page.getByLabel(/password/i).fill(ownerPassword!);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app\//);
  });

  test("dashboard and key nav routes load", async ({ page }) => {
    await page.goto("/app/dashboard");
    await expect(page.getByRole("heading").first()).toBeVisible();

    for (const path of [
      "/app/bookings",
      "/app/jobs",
      "/app/customers",
      "/app/services",
      "/app/calendar",
      "/app/payments",
      "/app/team",
      "/app/settings/business",
    ]) {
      await page.goto(path);
      await expect(page.locator("body")).not.toContainText("Application error");
    }
  });

  test("manual booking page loads", async ({ page }) => {
    await page.goto("/app/bookings/new");
    await expect(page.getByText(/manual booking|new booking/i).first()).toBeVisible();
  });
});

import { chromium } from "playwright";
import { roleStoragePath } from "./paths";

async function main() {
  const storage = roleStoragePath("convertlabs", "owner");
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: storage,
  });
  const page = await ctx.newPage();

  for (const url of [
    "https://convertlabs.io/dashboard",
    "https://convertlabs.io/get-started",
  ]) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(3000);
    const hasPassword = await page
      .locator('input[type="password"]')
      .isVisible()
      .catch(() => false);
    const bodySample = await page.locator("body").innerText();
    console.log("URL:", page.url());
    console.log("Title:", await page.title());
    console.log("Login form:", hasPassword);
    console.log("Body sample:", bodySample.replace(/\s+/g, " ").slice(0, 400));
    console.log("---");
  }

  await browser.close();
}

main();

import { chromium } from "playwright";

async function main() {
  const storage =
    "competitor-research/targets/convertlabs/roles/provider-portal.storage.json";
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: storage,
  });
  const page = await ctx.newPage();
  await page.goto("https://teams.convertlabs.io/dashboard", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(3000);

  for (const tab of ["My Jobs", "Open Jobs"]) {
    await page.getByText(tab, { exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(2500);
    const text = await page.locator("body").innerText();
    console.log(`=== ${tab} ===`);
    console.log(text.replace(/\s+/g, " ").slice(0, 1000));
    console.log("---");
  }

  // Try clicking any job-like element on My Jobs
  await page.getByText("My Jobs", { exact: true }).first().click();
  await page.waitForTimeout(2000);

  const jobCard = page.locator("[class*='job'], [class*='card'], table tbody tr").first();
  if (await jobCard.isVisible().catch(() => false)) {
    await jobCard.click();
    await page.waitForTimeout(3000);
    console.log("=== After job click ===");
    console.log((await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 1500));
  }

  await page.screenshot({
    path: "competitor-research/targets/convertlabs/screenshots/provider-portal/debug-live-state.png",
    fullPage: true,
  });
  await browser.close();
}

main();

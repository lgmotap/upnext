import { chromium } from "playwright";
import { roleStoragePath } from "./paths";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: roleStoragePath("convertlabs", "owner"),
  });
  const page = await ctx.newPage();

  const urls = [
    "https://convertlabs.io/billing",
    "https://convertlabs.io/accounts/billing",
    "https://convertlabs.io/account/billing",
    "https://convertlabs.io/company",
    "https://convertlabs.io/accounts",
    "https://convertlabs.io/account",
    "https://convertlabs.io/api-keys",
    "https://convertlabs.io/apikeys",
    "https://convertlabs.io/perks",
    "https://convertlabs.io/community",
    "https://convertlabs.io/settings/billing",
    "https://convertlabs.io/booking/billing",
  ];

  for (const url of urls) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    const title = await page.title();
    const hasLogin = await page.locator('input[type="password"]').isVisible().catch(() => false);
    const h2 = await page.locator("h1, h2").first().textContent().catch(() => "");
    console.log(url, "→", page.url(), "|", h2?.trim(), "| login:", hasLogin);
  }

  // Programmatic dropdown click
  await page.goto("https://convertlabs.io/dashboard", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.evaluate(`(() => {
    const arrow = document.querySelector(".el-dropdown-selfdefine") || document.querySelector(".el-icon-arrow-down");
    if (arrow) arrow.click();
  })()`);
  await page.waitForTimeout(1500);

  const menu = await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    return [...document.querySelectorAll(".el-dropdown-menu__item, .el-dropdown-menu a, .el-dropdown-menu li")].map(el => ({
      text: norm(el.textContent),
      href: el.getAttribute("href") || "",
      y: el.getBoundingClientRect().y
    })).filter(x => x.text);
  })()`);
  console.log("\nDropdown items:", JSON.stringify(menu, null, 2));

  await browser.close();
}

main();

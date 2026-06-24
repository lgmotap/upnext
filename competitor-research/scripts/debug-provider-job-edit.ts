import { chromium } from "playwright";

async function main() {
  const storage =
    "competitor-research/targets/convertlabs/roles/provider-portal.storage.json";
  const browser = await chromium.launch({ headless: true });
  const page = await (
    await browser.newContext({
      viewport: { width: 1440, height: 900 },
      storageState: storage,
    })
  ).newPage();

  await page.goto("https://teams.convertlabs.io/dashboard", {
    waitUntil: "networkidle",
  });
  await page.getByText("My Jobs", { exact: true }).first().click();
  await page.waitForTimeout(2000);

  const rowInfo = await page.evaluate(`(() => {
    const row = document.querySelector("table tbody tr");
    if (!row) return { error: "no row" };
    const buttons = [...row.querySelectorAll("button, a, svg, i, [class*='icon'], [class*='edit']")].map((el) => ({
      tag: el.tagName,
      class: (el.className && el.className.toString) ? el.className.toString() : "",
      aria: el.getAttribute("aria-label"),
      text: (el.textContent || "").trim().slice(0, 50),
      href: el.getAttribute("href"),
    }));
    return { rowHtml: row.innerHTML.slice(0, 1200), buttons };
  })()`);
  console.log(JSON.stringify(rowInfo, null, 2));

  const iconSelectors = [
    "table tbody tr svg",
    "table tbody tr [class*='edit']",
    "table tbody tr button",
    "table tbody tr a",
    "table tbody tr td:last-child *",
  ];

  for (const sel of iconSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
      console.log(`Clicking: ${sel}`);
      await el.click();
      await page.waitForTimeout(3500);
      const body = (await page.locator("body").innerText())
        .replace(/\s+/g, " ")
        .slice(0, 2500);
      console.log(`URL: ${page.url()}`);
      console.log(`Body: ${body}`);
      await page.screenshot({
        path: "competitor-research/targets/convertlabs/screenshots/provider-portal/debug-job-edit-click.png",
        fullPage: true,
      });
      break;
    }
  }

  await browser.close();
}

main();

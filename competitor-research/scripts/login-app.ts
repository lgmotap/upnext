#!/usr/bin/env tsx
/**
 * Automated app login — credentials from gitignored local file or env vars.
 * npm run research:login -- --target convertlabs
 *
 * Credentials file (gitignored): targets/<target>/.credentials.local.json
 * { "loginUrl": "https://convertlabs.io/get-started", "email": "...", "password": "..." }
 *
 * Or env: COMPETITOR_LOGIN_EMAIL, COMPETITOR_LOGIN_PASSWORD, COMPETITOR_LOGIN_URL
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { chromium } from "playwright";
import { ensureTargetDirs, roleStoragePath, targetDir } from "./paths";
import { loadRegistry, parseArgs, requireArg } from "./utils";
import type { ResearchRole } from "./types";

interface Credentials {
  loginUrl: string;
  email: string;
  password: string;
}

function loadCredentials(target: string, registryLoginUrl?: string): Credentials {
  const email = process.env.COMPETITOR_LOGIN_EMAIL;
  const password = process.env.COMPETITOR_LOGIN_PASSWORD;
  if (email && password) {
    return {
      loginUrl:
        process.env.COMPETITOR_LOGIN_URL ??
        registryLoginUrl ??
        "https://convertlabs.io/get-started",
      email,
      password,
    };
  }

  const credPath = `${targetDir(target)}/.credentials.local.json`;
  if (!existsSync(credPath)) {
    throw new Error(
      `No credentials. Create ${credPath} or set COMPETITOR_LOGIN_EMAIL / COMPETITOR_LOGIN_PASSWORD`,
    );
  }

  return JSON.parse(readFileSync(credPath, "utf8")) as Credentials;
}

export async function loginAndSaveSession(options: {
  target: string;
  role?: ResearchRole;
  headless?: boolean;
  loginUrl?: string;
}): Promise<{ storagePath: string; postLoginUrl: string }> {
  const { target, role = "owner", headless = true } = options;
  const registry = loadRegistry(target);
  const creds = loadCredentials(
    target,
    options.loginUrl ?? registry.appLoginUrl ?? "https://convertlabs.io/get-started",
  );

  ensureTargetDirs(target);
  const storagePath = roleStoragePath(target, role);
  mkdirSync(roleStoragePath(target, role).replace(/\/[^/]+$/, ""), {
    recursive: true,
  });

  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(creds.loginUrl, { waitUntil: "networkidle", timeout: 60_000 });

    // Email field
    const emailInput = page
      .locator('input[type="email"], input[name="email"], input[autocomplete="email"]')
      .first();
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });
    await emailInput.fill(creds.email);

    // Password field
    const passwordInput = page
      .locator('input[type="password"], input[name="password"]')
      .first();
    await passwordInput.fill(creds.password);

    // Submit
    const submit = page
      .locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Log in")',
      )
      .first();
    await submit.click();

    // Wait for navigation away from login
    await page.waitForURL(
      (url) => !url.pathname.includes("get-started") && !url.pathname.includes("login"),
      { timeout: 30_000 },
    ).catch(async () => {
      // May land on dashboard with same host — check we're not still on login form
      const stillLogin = await page
        .locator('input[type="password"]')
        .isVisible()
        .catch(() => false);
      if (stillLogin) {
        const errText = await page
          .locator('[class*="error"], [role="alert"]')
          .allTextContents()
          .catch(() => []);
        throw new Error(`Login failed — still on login page. ${errText.join(" ")}`);
      }
    });

    await page.waitForTimeout(3000);

    const postLoginUrl = page.url();
    await context.storageState({ path: storagePath });

    return { storagePath, postLoginUrl };
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const target = requireArg(args, "target");
  const headless = !args.headed;

  console.log(`Logging in to ${target} app…`);
  const result = await loginAndSaveSession({ target, headless });
  console.log(`Saved session: ${result.storagePath}`);
  console.log(`Landed on: ${result.postLoginUrl}`);
}

const isDirectRun = process.argv[1]?.includes("login-app");
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

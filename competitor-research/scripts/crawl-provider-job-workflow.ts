#!/usr/bin/env tsx
/**
 * Exhaustive provider job workflow capture — every action + post-action UI.
 * npm run research:crawl-provider-workflow -- --target convertlabs
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium, type Page } from "playwright";
import { captureCurrentPage } from "./capture-inline";
import { targetDir } from "./paths";
import { parseArgs, requireArg, slugify, sleep } from "./utils";
import type { RegistryPage } from "./types";

const BASE = "https://teams.convertlabs.io/dashboard";

interface WorkflowStep {
  step: number;
  action: string;
  captureId: string;
  label: string;
  url: string;
  buttonsVisible: string[];
  modalsVisible: string[];
  notes?: string;
}

interface WorkflowMap {
  target: string;
  crawledAt: string;
  jobContext: string;
  steps: WorkflowStep[];
}

function providerDirs(target: string) {
  const dataDir = join(targetDir(target), "data", "provider-portal");
  const shotDir = join(targetDir(target), "screenshots", "provider-portal");
  const reportDir = join(targetDir(target), "reports");
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(shotDir, { recursive: true });
  mkdirSync(reportDir, { recursive: true });
  return { dataDir, shotDir, reportDir };
}

async function snap(
  target: string,
  page: Page,
  id: string,
  label: string,
  waitMs = 3000,
): Promise<{ buttons: string[]; modals: string[] }> {
  const meta: RegistryPage = {
    id,
    phase: "phase-14-provider-workflow",
    url: page.url(),
    role: "provider",
    source: "portal",
    label,
    waitMs,
  };
  const paths = await captureCurrentPage(target, page, meta);
  const { dataDir, shotDir } = providerDirs(target);
  writeFileSync(join(dataDir, `${id}.json`), readFileSync(paths.jsonPath, "utf8"));
  copyFileSync(paths.screenshotPath, join(shotDir, `${id}.png`));

  const ui = await discoverDialogUi(page);
  console.log(`  ✓ ${label}`);
  if (ui.buttons.length) console.log(`    buttons: ${ui.buttons.join(" | ")}`);
  return ui;
}

async function discoverDialogUi(page: Page): Promise<{ buttons: string[]; modals: string[] }> {
  return (await page.evaluate(`(() => {
    const norm = (s) => (s || "").replace(/\\s+/g, " ").trim();
    const buttons = [];
    const seen = new Set();
    document.querySelectorAll("[role='dialog'] button, .el-dialog button, .el-drawer button, .modal button").forEach((el) => {
      const text = norm(el.textContent || el.getAttribute("aria-label") || "");
      if (text && text.length < 80 && !seen.has(text)) {
        seen.add(text);
        buttons.push(text);
      }
    });
    if (buttons.length === 0) {
      document.querySelectorAll("button").forEach((el) => {
        const text = norm(el.textContent || el.getAttribute("aria-label") || "");
        if (text && text.length < 80 && !seen.has(text)) {
          seen.add(text);
          buttons.push(text);
        }
      });
    }
    const modals = [];
    document.querySelectorAll("[role='dialog'], .el-dialog, .el-drawer, .modal").forEach((el) => {
      const text = norm(el.textContent || "").slice(0, 300);
      if (text) modals.push(text);
    });
    return { buttons, modals };
  })()`)) as { buttons: string[]; modals: string[] };
}

async function gotoMyJobs(page: Page): Promise<void> {
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(2000);
  await page.getByText("My Jobs", { exact: true }).first().click();
  await page.waitForTimeout(2000);
}

async function openJobDrawer(page: Page): Promise<boolean> {
  const edit = page.locator("table tbody tr td:last-child .cell").first();
  if (!(await edit.isVisible({ timeout: 5000 }).catch(() => false))) return false;
  await edit.click();
  await page.waitForTimeout(3500);
  return true;
}

async function closeOverlays(page: Page): Promise<void> {
  const closeBtn = page.getByRole("button", { name: /close/i }).first();
  if (await closeBtn.isVisible({ timeout: 800 }).catch(() => false)) {
    await closeBtn.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(500);
}

async function clickDialogButton(page: Page, pattern: RegExp): Promise<boolean> {
  // Prefer topmost message-box / confirm dialogs first
  const msgBox = page.locator(".el-message-box button, [role='dialog'][aria-label='Warning'] button, [role='alertdialog'] button").filter({ hasText: pattern });
  if (await msgBox.first().isVisible({ timeout: 1500 }).catch(() => false)) {
    await msgBox.first().click();
    return true;
  }
  const inDialog = page.locator("[role='dialog'] button, .el-dialog button, .el-drawer button").filter({ hasText: pattern });
  if (await inDialog.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await inDialog.first().click();
    return true;
  }
  const global = page.getByRole("button", { name: pattern }).first();
  if (await global.isVisible({ timeout: 1500 }).catch(() => false)) {
    await global.click();
    return true;
  }
  return false;
}

async function captureConfirmDialog(
  target: string,
  page: Page,
  actionName: string,
  steps: WorkflowStep[],
  stepRef: { n: number },
): Promise<boolean> {
  const warning = page.locator(".el-message-box__wrapper, [role='dialog'][aria-label='Warning'], [role='alertdialog']").first();
  if (!(await warning.isVisible({ timeout: 3000 }).catch(() => false))) return false;

  const id = `provider-workflow-${slugify(actionName)}-confirm-dialog`;
  const ui = await snap(target, page, id, `${actionName} — confirmation dialog`, 1500);
  steps.push({
    step: stepRef.n++,
    action: `${actionName}:confirm-dialog`,
    captureId: id,
    label: `${actionName} confirmation`,
    url: page.url(),
    buttonsVisible: ui.buttons,
    modalsVisible: ui.modals,
  });

  // Confirm: prefer "Yes, Send Notification" / Yes / Confirm / OK
  const yesBtn = page.locator(".el-message-box__btns button, .el-message-box button").filter({ hasText: /yes,\s*send notification|yes|confirm|ok|send notification/i });
  if (await yesBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await yesBtn.first().click({ force: true });
    await page.waitForTimeout(3000);
    return true;
  }
  return false;
}

async function handleConfirmDialogs(page: Page): Promise<void> {
  for (const label of [/confirm/i, /^yes$/i, /^ok$/i, /^submit$/i, /^send$/i, /^save$/i]) {
    if (await clickDialogButton(page, label)) {
      await page.waitForTimeout(2500);
    }
  }
}

async function fillVisibleInputs(page: Page): Promise<void> {
  const inputs = page.locator("[role='dialog'] input:visible, [role='dialog'] textarea:visible, .el-dialog input:visible, .el-dialog textarea:visible");
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    const type = (await input.getAttribute("type")) ?? "text";
    if (type === "checkbox" || type === "radio") continue;
    await input.fill("15").catch(() => input.fill("Test note for research capture").catch(() => {}));
  }
  const selects = page.locator("[role='dialog'] select:visible, .el-dialog select:visible");
  const selCount = await selects.count();
  for (let i = 0; i < selCount; i++) {
    await selects.nth(i).selectOption({ index: 1 }).catch(() => {});
  }
}

async function scrollDrawer(page: Page): Promise<void> {
  await page.evaluate(`(() => {
    const drawer = document.querySelector("[role='dialog'], .el-dialog, .el-drawer, .el-dialog__body");
    if (drawer) drawer.scrollTop = drawer.scrollHeight;
  })()`);
  await page.waitForTimeout(800);
}

async function captureAllDialogSections(
  target: string,
  page: Page,
  prefix: string,
  label: string,
  steps: WorkflowStep[],
  stepRef: { n: number },
): Promise<void> {
  await scrollDrawer(page);
  const top = await snap(target, page, `${prefix}-top`, `${label} — top`);
  steps.push({
    step: stepRef.n++,
    action: "scroll-capture",
    captureId: `${prefix}-top`,
    label: `${label} — top`,
    url: page.url(),
    buttonsVisible: top.buttons,
    modalsVisible: top.modals,
  });

  await page.evaluate(`(() => {
    const drawer = document.querySelector("[role='dialog'], .el-dialog, .el-drawer, .el-dialog__body");
    if (drawer) drawer.scrollTop = Math.floor(drawer.scrollHeight / 2);
  })()`);
  await page.waitForTimeout(800);
  const mid = await snap(target, page, `${prefix}-mid`, `${label} — mid scroll`);
  steps.push({
    step: stepRef.n++,
    action: "scroll-capture",
    captureId: `${prefix}-mid`,
    label: `${label} — mid scroll`,
    url: page.url(),
    buttonsVisible: mid.buttons,
    modalsVisible: mid.modals,
  });

  await scrollDrawer(page);
  const bottom = await snap(target, page, `${prefix}-bottom`, `${label} — bottom scroll`);
  steps.push({
    step: stepRef.n++,
    action: "scroll-capture",
    captureId: `${prefix}-bottom`,
    label: `${label} — bottom scroll`,
    url: page.url(),
    buttonsVisible: bottom.buttons,
    modalsVisible: bottom.modals,
  });
}

async function tryAction(
  target: string,
  page: Page,
  actionName: string,
  pattern: RegExp,
  steps: WorkflowStep[],
  stepRef: { n: number },
): Promise<void> {
  console.log(`\n→ Action: ${actionName}`);
  await gotoMyJobs(page);
  if (!(await openJobDrawer(page))) {
    console.log("  No job drawer available");
    return;
  }

  const before = await discoverDialogUi(page);
  const clicked = await clickDialogButton(page, pattern);
  if (!clicked) {
    console.log(`  Button not found: ${actionName}`);
    steps.push({
      step: stepRef.n++,
      action: actionName,
      captureId: "",
      label: `${actionName} — not found`,
      url: page.url(),
      buttonsVisible: before.buttons,
      modalsVisible: before.modals,
      notes: "Button not visible",
    });
    return;
  }

  await page.waitForTimeout(2000);

  // Running Late often opens an ETA form before confirm
  if (/running late/i.test(actionName)) {
    await fillVisibleInputs(page);
    const lateFormId = `provider-workflow-${slugify(actionName)}-form`;
    const lateUi = await snap(target, page, lateFormId, `${actionName} — late form`, 1500);
    steps.push({
      step: stepRef.n++,
      action: `${actionName}:form`,
      captureId: lateFormId,
      label: `${actionName} form`,
      url: page.url(),
      buttonsVisible: lateUi.buttons,
      modalsVisible: lateUi.modals,
    });
    await clickDialogButton(page, /submit|send|confirm|ok|save/i);
    await page.waitForTimeout(2000);
  }

  // Confirmation dialog (e.g. On The Way → "Yes, Send Notification")
  const hadConfirm = await captureConfirmDialog(target, page, actionName, steps, stepRef);
  if (hadConfirm) {
    const afterConfirmId = `provider-workflow-${slugify(actionName)}-after-confirm`;
    const afterConfirmUi = await snap(target, page, afterConfirmId, `After confirm: ${actionName}`, 2000);
    steps.push({
      step: stepRef.n++,
      action: `${actionName}:after-confirm`,
      captureId: afterConfirmId,
      label: `After confirm: ${actionName}`,
      url: page.url(),
      buttonsVisible: afterConfirmUi.buttons,
      modalsVisible: afterConfirmUi.modals,
    });
  }

  const id = `provider-workflow-${slugify(actionName)}`;
  const ui = await snap(target, page, id, `After: ${actionName}`, 2000);
  steps.push({
    step: stepRef.n++,
    action: actionName,
    captureId: id,
    label: `After: ${actionName}`,
    url: page.url(),
    buttonsVisible: ui.buttons,
    modalsVisible: ui.modals,
  });

  // Capture nested sub-panels only when no blocking message-box
  const hasMsgBox = await page.locator(".el-message-box__wrapper").isVisible({ timeout: 500 }).catch(() => false);
  if (!hasMsgBox) {
    await fillVisibleInputs(page);
    await handleConfirmDialogs(page);
    const nestedPatterns = [
      /minutes/i,
      /eta/i,
      /reason/i,
      /note/i,
      /photo/i,
      /checklist/i,
      /clock out/i,
      /complete/i,
      /checkout/i,
      /signature/i,
    ];
    for (const pat of nestedPatterns) {
      const nestedBtn = page.getByRole("button", { name: pat }).first();
      if (await nestedBtn.isVisible({ timeout: 800 }).catch(() => false)) {
        const nestedName = pat.source;
        await nestedBtn.click();
        await page.waitForTimeout(2500);
        await fillVisibleInputs(page);
        const nestedId = `provider-workflow-${slugify(actionName)}-${slugify(nestedName)}`;
        const nestedUi = await snap(target, page, nestedId, `${actionName} → ${pat.source}`, 2000);
        steps.push({
          step: stepRef.n++,
          action: `${actionName} → ${pat.source}`,
          captureId: nestedId,
          label: `${actionName} nested: ${pat.source}`,
          url: page.url(),
          buttonsVisible: nestedUi.buttons,
          modalsVisible: nestedUi.modals,
        });
        await closeOverlays(page);
      }
    }
  }

  await closeOverlays(page);
  await sleep(1500);
}

async function explorePostCheckIn(
  target: string,
  page: Page,
  steps: WorkflowStep[],
  stepRef: { n: number },
): Promise<void> {
  console.log("\n=== Post check-in exploration ===");
  await gotoMyJobs(page);
  if (!(await openJobDrawer(page))) return;

  const ui = await discoverDialogUi(page);
  await captureAllDialogSections(
    target,
    page,
    "provider-workflow-post-checkin-drawer",
    "Post check-in drawer",
    steps,
    stepRef,
  );

  const actionPatterns = [
    "Clock Out",
    "Check Out",
    "Complete",
    "Complete Job",
    "Finish",
    "Checklist",
    "Photos",
    "Upload",
    "Add Photo",
    "Navigate",
    "Directions",
    "Maps",
    "Notes",
    "Add Note",
    "Report Issue",
    "Cancel",
    "On The Way",
    "Running Late",
    "Check-In",
    "Start",
    "Pause",
    "Resume",
  ];

  for (const action of actionPatterns) {
    const pat = new RegExp(action.replace(/[- ]/g, "[\\- ]?"), "i");
    if (!ui.buttons.some((b) => pat.test(b))) continue;

    console.log(`  Exploring: ${action}`);
    await gotoMyJobs(page);
    if (!(await openJobDrawer(page))) continue;

    if (await clickDialogButton(page, pat)) {
      await page.waitForTimeout(3000);
      await fillVisibleInputs(page);
      await handleConfirmDialogs(page);
      const id = `provider-workflow-post-checkin-${slugify(action)}`;
      const after = await snap(target, page, id, `Post check-in: ${action}`, 2000);
      steps.push({
        step: stepRef.n++,
        action: `post-checkin:${action}`,
        captureId: id,
        label: `Post check-in: ${action}`,
        url: page.url(),
        buttonsVisible: after.buttons,
        modalsVisible: after.modals,
      });

      // Try file upload if present
      const fileInput = page.locator("input[type='file']").first();
      if (await fileInput.count().then((c) => c > 0).catch(() => false)) {
        steps.push({
          step: stepRef.n++,
          action: `post-checkin:${action}:file-input`,
          captureId: id,
          label: `File upload input detected after ${action}`,
          url: page.url(),
          buttonsVisible: after.buttons,
          modalsVisible: after.modals,
          notes: "Photo upload input present",
        });
      }

      await closeOverlays(page);
    }
  }
}

function writeWorkflowReport(target: string, map: WorkflowMap): void {
  const { reportDir } = providerDirs(target);
  writeFileSync(
    join(reportDir, "provider-job-workflow.json"),
    JSON.stringify(map, null, 2),
    "utf8",
  );

  const lines = [
    "# Provider job workflow map",
    "",
    `Generated: ${map.crawledAt}`,
    "",
    `Context: ${map.jobContext}`,
    "",
    "## State transitions",
    "",
    "| Step | Action | Capture | Buttons visible |",
    "|------|--------|---------|-----------------|",
  ];

  for (const s of map.steps) {
    const btns = s.buttonsVisible.slice(0, 6).join(", ") || "—";
    lines.push(`| ${s.step} | ${s.action} | \`${s.captureId || "—"}\` | ${btns} |`);
  }

  lines.push("", "## Notes", "");
  for (const s of map.steps.filter((x) => x.notes)) {
    lines.push(`- **${s.action}:** ${s.notes}`);
  }

  writeFileSync(join(reportDir, "provider-job-workflow.md"), lines.join("\n"), "utf8");
}

async function main() {
  const target = requireArg(parseArgs(process.argv.slice(2)), "target");
  const storage = join(targetDir(target), "roles", "provider-portal.storage.json");
  const steps: WorkflowStep[] = [];
  const stepRef = { n: 1 };

  const browser = await chromium.launch({ headless: true });
  const page = await (
    await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: storage })
  ).newPage();

  console.log("\n=== Provider job workflow — initial state ===");
  await gotoMyJobs(page);
  const listUi = await snap(target, page, "provider-workflow-my-jobs-list", "My Jobs list");
  steps.push({
    step: stepRef.n++,
    action: "open-my-jobs",
    captureId: "provider-workflow-my-jobs-list",
    label: "My Jobs list",
    url: page.url(),
    buttonsVisible: listUi.buttons,
    modalsVisible: listUi.modals,
  });

  if (!(await openJobDrawer(page))) {
    console.error("No assigned job found on My Jobs");
    await browser.close();
    process.exit(1);
  }

  await captureAllDialogSections(
    target,
    page,
    "provider-workflow-drawer-initial",
    "Initial Booking Details drawer",
    steps,
    stepRef,
  );

  // Maps link
  const mapsLink = page.getByRole("link", { name: /maps/i }).first();
  if (await mapsLink.isVisible({ timeout: 1500 }).catch(() => false)) {
    const href = await mapsLink.getAttribute("href");
    steps.push({
      step: stepRef.n++,
      action: "maps-link",
      captureId: "provider-workflow-drawer-initial-top",
      label: "Maps link in drawer",
      url: page.url(),
      buttonsVisible: [],
      modalsVisible: [],
      notes: `Maps href: ${href ?? "none"}`,
    });
  }

  await closeOverlays(page);

  // Status actions in order (least → most destructive)
  const statusActions: Array<[string, RegExp]> = [
    ["On The Way", /on the way/i],
    ["Running Late", /running late/i],
    ["Check-In", /check[\- ]?in/i],
  ];

  for (const [name, pat] of statusActions) {
    await tryAction(target, page, name, pat, steps, stepRef);
  }

  // After check-in, explore everything still available
  await explorePostCheckIn(target, page, steps, stepRef);

  // Mobile pass on final state
  console.log("\n=== Mobile workflow pass ===");
  await gotoMyJobs(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(1000);
  const mobileList = await snap(target, page, "provider-workflow-mobile-my-jobs", "Mobile My Jobs");
  steps.push({
    step: stepRef.n++,
    action: "mobile-my-jobs",
    captureId: "provider-workflow-mobile-my-jobs",
    label: "Mobile My Jobs",
    url: page.url(),
    buttonsVisible: mobileList.buttons,
    modalsVisible: mobileList.modals,
  });

  if (await openJobDrawer(page)) {
    const mobileDrawer = await snap(target, page, "provider-workflow-mobile-drawer", "Mobile drawer");
    steps.push({
      step: stepRef.n++,
      action: "mobile-drawer",
      captureId: "provider-workflow-mobile-drawer",
      label: "Mobile Booking Details drawer",
      url: page.url(),
      buttonsVisible: mobileDrawer.buttons,
      modalsVisible: mobileDrawer.modals,
    });
  }

  await browser.close();

  const map: WorkflowMap = {
    target,
    crawledAt: new Date().toISOString(),
    jobContext: "Fresh Home Cleaning / Team John — 123 William St, 25 Jun",
    steps,
  };
  writeWorkflowReport(target, map);

  console.log(`\n=== Done ===`);
  console.log(`Steps captured: ${steps.length}`);
  console.log(`Report: ${join(targetDir(target), "reports", "provider-job-workflow.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

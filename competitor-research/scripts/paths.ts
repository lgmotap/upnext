import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
export const RESEARCH_ROOT = join(scriptsDir, "..");

export function targetDir(target: string): string {
  return join(RESEARCH_ROOT, "targets", target);
}

export function ensureTargetDirs(target: string): {
  root: string;
  screenshots: string;
  data: string;
  reports: string;
  roles: string;
} {
  const root = targetDir(target);
  const screenshots = join(root, "screenshots");
  const data = join(root, "data");
  const reports = join(root, "reports");
  const roles = join(root, "roles");

  for (const dir of [root, screenshots, data, reports, roles]) {
    mkdirSync(dir, { recursive: true });
  }

  return { root, screenshots, data, reports, roles };
}

export function registryPath(target: string): string {
  return join(targetDir(target), "page-registry.json");
}

export function pageJsonPath(target: string, pageId: string): string {
  return join(targetDir(target), "data", `${pageId}.json`);
}

export function pageScreenshotPath(target: string, pageId: string): string {
  return join(targetDir(target), "screenshots", `${pageId}.png`);
}

export function roleStoragePath(target: string, role: string): string {
  return join(targetDir(target), "roles", `${role}.storage.json`);
}

export function manifestPath(target: string): string {
  return join(targetDir(target), "data", "manifest.json");
}

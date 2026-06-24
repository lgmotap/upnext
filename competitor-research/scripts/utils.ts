import { existsSync, readFileSync } from "node:fs";
import type { PageRegistry } from "./types";
import { registryPath } from "./paths";

export function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

export function requireArg(
  args: Record<string, string | boolean>,
  key: string,
): string {
  const value = args[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required argument: --${key}`);
  }
  return value;
}

export function loadRegistry(target: string): PageRegistry {
  const path = registryPath(target);
  if (!existsSync(path)) {
    throw new Error(
      `Registry not found: ${path}\nCopy templates/page-registry.example.json to targets/${target}/page-registry.json`,
    );
  }

  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as PageRegistry;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

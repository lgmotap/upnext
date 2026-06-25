import { NextResponse } from "next/server";

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function apiData<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ?? {}) });
}

/** YYYY-MM-DD in org-local context (caller validates). */
export function parseApiDateYmd(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return null;
  const d = new Date(`${raw.trim()}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return raw.trim();
}

export function parsePositiveInt(raw: string | null): number | null {
  if (!raw?.trim()) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

export function parseCsvIds(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

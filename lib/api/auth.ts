import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashApiKey } from "@/lib/api/keys";
import { authenticateApiKey } from "@/server/repositories/api-keys";

export type ApiAuthContext = {
  organizationId: string;
  apiKeyId: string;
};

export async function requireApiKey(request: Request): Promise<ApiAuthContext | NextResponse> {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Missing Bearer token" } },
      { status: 401 },
    );
  }

  const rawKey = auth.slice("Bearer ".length).trim();
  if (!rawKey.startsWith("unx_live_")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid API key format" } },
      { status: 401 },
    );
  }

  const keyHash = hashApiKey(rawKey);
  const rateKey = `api:${keyHash}`;
  if (!checkRateLimit(rateKey, 120, 60_000)) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 },
    );
  }

  const ctx = await authenticateApiKey(keyHash);
  if (!ctx) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or revoked API key" } },
      { status: 401 },
    );
  }

  return ctx;
}

export function parseSinceCursor(raw: string | null): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

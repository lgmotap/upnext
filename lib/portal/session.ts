import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const PORTAL_SESSION_COOKIE = "upnext_customer_portal";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export type PortalSession = {
  customerId: string;
  organizationId: string;
  businessSlug: string;
  exp: number;
};

function signingSecret(): string {
  return (
    process.env.PORTAL_SESSION_SECRET ??
    process.env.CRON_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "dev-portal-session-secret"
  );
}

export function signPortalSession(payload: Omit<PortalSession, "exp">): string {
  const body = JSON.stringify({ ...payload, exp: Date.now() + SESSION_TTL_MS });
  const sig = createHmac("sha256", signingSecret()).update(body).digest("hex");
  return Buffer.from(`${body}.${sig}`).toString("base64url");
}

export function verifyPortalSession(token: string): PortalSession | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const dot = decoded.lastIndexOf(".");
    if (dot < 0) return null;
    const body = decoded.slice(0, dot);
    const sig = decoded.slice(dot + 1);
    const expected = createHmac("sha256", signingSecret()).update(body).digest("hex");
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
    const payload = JSON.parse(body) as PortalSession;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.customerId || !payload.organizationId || !payload.businessSlug) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getPortalSessionFromCookies(): Promise<PortalSession | null> {
  const jar = await cookies();
  const raw = jar.get(PORTAL_SESSION_COOKIE)?.value;
  if (!raw) return null;
  return verifyPortalSession(raw);
}

export async function setPortalSessionCookie(payload: Omit<PortalSession, "exp">): Promise<void> {
  const jar = await cookies();
  jar.set(PORTAL_SESSION_COOKIE, signPortalSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearPortalSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(PORTAL_SESSION_COOKIE);
}

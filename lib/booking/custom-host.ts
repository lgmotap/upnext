/** Normalize hostname for comparisons (lowercase, no port). */
export function normalizeBookingHost(host: string | null | undefined): string | null {
  if (!host) return null;
  const trimmed = host.trim().toLowerCase().replace(/\.$/, "");
  if (!trimmed) return null;
  const withoutPort = trimmed.split(":")[0] ?? trimmed;
  return withoutPort || null;
}

/** Primary app host from NEXT_PUBLIC_APP_URL (for routing comparisons). */
export function getAppHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!url) return null;
  try {
    return normalizeBookingHost(new URL(url).hostname);
  } catch {
    return null;
  }
}

export function isDefaultAppHost(host: string | null | undefined): boolean {
  const normalized = normalizeBookingHost(host);
  if (!normalized) return true;
  const appHost = getAppHostname();
  if (appHost && normalized === appHost) return true;
  if (normalized === "localhost" || normalized === "127.0.0.1") return true;
  if (normalized.endsWith(".vercel.app")) return true;
  return false;
}

/** Paths on a custom booking host that rewrite to /book/{slug}/… */
export function buildCustomHostRewritePath(pathname: string, publicSlug: string): string | null {
  const path = pathname === "" ? "/" : pathname;
  if (path === "/") return `/book/${publicSlug}`;
  if (path === "/embed" || path === "/embed/") return `/book/${publicSlug}/embed`;
  const confirmationMatch = /^\/confirmation\/([^/]+)\/?$/.exec(path);
  if (confirmationMatch) {
    return `/book/${publicSlug}/confirmation/${confirmationMatch[1]}`;
  }
  return null;
}

export const DEFAULT_BOOKING_CNAME_TARGET =
  process.env.NEXT_PUBLIC_BOOKING_CNAME_TARGET?.trim() || "cname.vercel-dns.com";

export type CustomBookingHostProfile = {
  publicSlug: string;
  customBookingHost: string | null;
  customBookingVerifiedAt: Date | null;
};

export function hasVerifiedCustomBookingHost(
  profile: CustomBookingHostProfile,
): profile is CustomBookingHostProfile & { customBookingHost: string; customBookingVerifiedAt: Date } {
  return Boolean(profile.customBookingHost && profile.customBookingVerifiedAt);
}

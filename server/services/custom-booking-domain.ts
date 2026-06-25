import { resolveCname } from "node:dns/promises";
import {
  DEFAULT_BOOKING_CNAME_TARGET,
  getAppHostname,
  normalizeBookingHost,
} from "@/lib/booking/custom-host";
import {
  getCustomBookingHostForOrg,
  markCustomBookingHostVerified,
  updateCustomBookingHost,
} from "@/server/repositories/custom-booking-host";

const VERCEL_CNAME_MARKERS = ["vercel-dns.com", "vercel.app"];

function cnamePointsToVercel(records: string[]): boolean {
  return records.some((record) =>
    VERCEL_CNAME_MARKERS.some((marker) => record.toLowerCase().includes(marker)),
  );
}

export async function probeCustomBookingHostDns(host: string): Promise<boolean> {
  const normalized = normalizeBookingHost(host);
  if (!normalized) return false;

  try {
    const cnames = await resolveCname(normalized);
    if (cnamePointsToVercel(cnames)) return true;
    if (cnames.some((c) => c.toLowerCase().includes(DEFAULT_BOOKING_CNAME_TARGET.toLowerCase()))) {
      return true;
    }
  } catch {
    // no CNAME — fall through to HTTP probe
  }

  try {
    const response = await fetch(`https://${normalized}/`, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(8_000),
    });
    return response.status > 0 && response.status < 500;
  } catch {
    return false;
  }
}

export async function saveCustomBookingHost(organizationId: string, hostInput: string) {
  const normalized = normalizeBookingHost(hostInput);
  if (!normalized) {
    return { ok: false as const, error: "Enter a valid hostname (e.g. book.yourbusiness.com)" };
  }

  const appHost = getAppHostname();
  if (appHost && normalized === appHost) {
    return { ok: false as const, error: "Use a subdomain different from your main app URL" };
  }

  if (normalized === "localhost" || normalized.endsWith(".localhost")) {
    return { ok: false as const, error: "localhost is not allowed as a custom booking host" };
  }

  return updateCustomBookingHost(organizationId, normalized);
}

export async function verifyCustomBookingHostForOrg(organizationId: string) {
  const profile = await getCustomBookingHostForOrg(organizationId);
  if (!profile?.customBookingHost) {
    return { ok: false as const, error: "Set a custom booking host first" };
  }

  const dnsOk = await probeCustomBookingHostDns(profile.customBookingHost);
  if (!dnsOk) {
    return {
      ok: false as const,
      error:
        "Could not verify DNS yet. Add the CNAME record and wait a few minutes, then try again.",
    };
  }

  await markCustomBookingHostVerified(organizationId);
  return { ok: true as const, host: profile.customBookingHost };
}

export async function clearCustomBookingHost(organizationId: string) {
  await updateCustomBookingHost(organizationId, null);
  return { ok: true as const };
}

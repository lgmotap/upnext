import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  buildCustomHostRewritePath,
  isDefaultAppHost,
  normalizeBookingHost,
} from "@/lib/booking/custom-host";

async function resolveBookingSlugForHost(host: string): Promise<string | null> {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    const url = new URL("/api/internal/booking-host", origin);
    url.searchParams.set("host", host);
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { slug?: string | null };
    return data.slug ?? null;
  } catch {
    return null;
  }
}

/** Rewrite custom booking host root paths to /book/{slug}/… */
export async function maybeRewriteCustomBookingHost(
  request: NextRequest,
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/") || pathname.startsWith("/app/") || pathname.startsWith("/_next/")) {
    return null;
  }

  const host = normalizeBookingHost(request.headers.get("host"));
  if (!host || isDefaultAppHost(host)) return null;

  const slug = await resolveBookingSlugForHost(host);
  if (!slug) return null;

  const rewritePath = buildCustomHostRewritePath(pathname, slug);
  if (!rewritePath) return null;

  const url = request.nextUrl.clone();
  url.pathname = rewritePath;
  return NextResponse.rewrite(url);
}

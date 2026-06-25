import { NextResponse } from "next/server";
import { findPublicSlugByVerifiedCustomBookingHost } from "@/server/repositories/custom-booking-host";
import { normalizeBookingHost } from "@/lib/booking/custom-host";

/** Resolve verified custom booking host → public slug (used by edge proxy). */
export async function GET(request: Request) {
  const host = normalizeBookingHost(new URL(request.url).searchParams.get("host"));
  if (!host) {
    return NextResponse.json({ slug: null });
  }

  const profile = await findPublicSlugByVerifiedCustomBookingHost(host);
  return NextResponse.json(
    { slug: profile?.publicSlug ?? null },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}

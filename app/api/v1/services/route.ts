import { NextResponse } from "next/server";
import { parseSinceCursor, requireApiKey } from "@/lib/api/auth";
import { listServicesForApi } from "@/server/repositories/public-api";

export async function GET(request: Request) {
  const auth = await requireApiKey(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const since = parseSinceCursor(searchParams.get("since"));
  if (searchParams.get("since") && !since) {
    return NextResponse.json(
      { error: { code: "INVALID_SINCE", message: "since must be an ISO-8601 timestamp" } },
      { status: 400 },
    );
  }

  const { data, nextSince } = await listServicesForApi(
    auth.organizationId,
    since,
    searchParams.get("limit"),
  );

  return NextResponse.json({
    data,
    ...(nextSince ? { next_since: nextSince } : {}),
  });
}

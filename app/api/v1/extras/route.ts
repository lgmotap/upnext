import { NextResponse } from "next/server";
import { parseSinceCursor, requireApiKey } from "@/lib/api/auth";
import { apiData, apiError } from "@/lib/api/response";
import { listExtrasForApi } from "@/server/repositories/public-api";

export async function GET(request: Request) {
  const auth = await requireApiKey(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const since = parseSinceCursor(searchParams.get("since"));
  if (searchParams.get("since") && !since) {
    return apiError("INVALID_SINCE", "since must be an ISO-8601 timestamp", 400);
  }

  const { data, nextSince } = await listExtrasForApi(
    auth.organizationId,
    since,
    searchParams.get("limit"),
  );

  return apiData(data, nextSince ? { next_since: nextSince } : undefined);
}

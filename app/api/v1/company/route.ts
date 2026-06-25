import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { apiData, apiError } from "@/lib/api/response";
import { getCompanyForApi } from "@/server/repositories/public-api";

export async function GET(request: Request) {
  const auth = await requireApiKey(request);
  if (auth instanceof NextResponse) return auth;

  const result = await getCompanyForApi(auth.organizationId);
  if (!result) return apiError("NOT_FOUND", "Business profile not found", 404);

  return apiData(result.data);
}

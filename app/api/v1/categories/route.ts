import { NextResponse } from "next/server";
import { requireApiKey } from "@/lib/api/auth";
import { apiData } from "@/lib/api/response";
import { listCategoriesForApi } from "@/server/repositories/public-api";

export async function GET(request: Request) {
  const auth = await requireApiKey(request);
  if (auth instanceof NextResponse) return auth;

  const { data } = await listCategoriesForApi(auth.organizationId);
  return apiData(data);
}

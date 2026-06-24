"use server";

import { getAppSession } from "@/server/permissions/session";
import { globalSearch, type GlobalSearchResult } from "@/server/services/global-search";

export async function globalSearchAction(query: string): Promise<GlobalSearchResult[]> {
  const session = await getAppSession();
  if (!session) return [];
  return globalSearch(session.organizationId, query);
}

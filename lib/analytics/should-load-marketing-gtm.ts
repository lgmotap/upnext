import { headers } from "next/headers";
import { getGtmConfig } from "@/lib/analytics/gtm";
import { MARKETING_PAGE_HEADER } from "@/lib/seo/marketing-paths";

/** True when GTM env is set and the current request is an indexable marketing page. */
export async function shouldLoadMarketingGtm(): Promise<boolean> {
  const { enabled } = getGtmConfig();
  if (!enabled) return false;

  const headersList = await headers();
  return headersList.get(MARKETING_PAGE_HEADER) === "1";
}

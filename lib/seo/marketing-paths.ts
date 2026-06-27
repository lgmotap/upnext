import { marketingRoutes } from "@/lib/config";

/**
 * Indexable marketing pathnames on bookedfox.com.
 * Keep in sync with `marketingRoutes` in lib/config.ts — add new marketing
 * pages to both when launching SEO content (sitemap + GTM + index: true).
 */
export const marketingPathnames = marketingRoutes.map((route) => route.path) as readonly string[];

/** Header set by proxy.ts so root layout can gate marketing-only tags (GTM, etc.). */
export const MARKETING_PAGE_HEADER = "x-marketing-page";

export function isMarketingPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "/";
  return (marketingPathnames as readonly string[]).includes(normalized);
}

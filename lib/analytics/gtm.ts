/**
 * Google Tag Manager — marketing site only (see lib/seo/marketing-paths.ts).
 * Set NEXT_PUBLIC_GTM_ID in Vercel + .env.local for production tracking.
 */
const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

export type GtmConfig = {
  id: string;
  enabled: boolean;
};

export function getGtmConfig(): GtmConfig {
  const id = (process.env.NEXT_PUBLIC_GTM_ID ?? "").trim();
  const enabled = GTM_ID_PATTERN.test(id);
  return { id, enabled };
}

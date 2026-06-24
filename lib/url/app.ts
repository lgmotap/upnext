const DEFAULT_APP_URL = "http://localhost:3000";

/** Canonical app origin (no trailing slash). Safe in client and server bundles. */
export function getPublicAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() || DEFAULT_APP_URL;
  return url.replace(/\/$/, "");
}

/** Public booking page for a business slug. */
export function getBookingPageUrl(publicSlug: string): string {
  const slug = publicSlug.trim();
  if (!slug) return "";
  return `${getPublicAppUrl()}/book/${slug}`;
}

/** Chrome-free embed route for iframe widgets. */
export function getBookingEmbedUrl(publicSlug: string): string {
  const slug = publicSlug.trim();
  if (!slug) return "";
  return `${getPublicAppUrl()}/book/${slug}/embed`;
}

/** iframe snippet for Settings → Portals. */
export function getBookingEmbedHtml(publicSlug: string): string {
  const src = getBookingEmbedUrl(publicSlug);
  if (!src) return "";
  return `<iframe src="${src}" width="100%" height="720" style="border:0;border-radius:12px" title="Book online"></iframe>`;
}

/** True when deployed but APP_URL still points at localhost. */
export function isBookingUrlMisconfigured(): boolean {
  const url = getPublicAppUrl();
  if (process.env.NODE_ENV === "development") return false;
  return url.includes("localhost") || url.includes("127.0.0.1");
}

/** Customer portal entry (sprint 10 builds auth; URL is stable for settings). */
export function getCustomerPortalUrl(publicSlug: string): string {
  const slug = publicSlug.trim();
  if (!slug) return "";
  return `${getPublicAppUrl()}/my/${slug}`;
}

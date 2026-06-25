import {
  getAppHostname,
  hasVerifiedCustomBookingHost,
  normalizeBookingHost,
  type CustomBookingHostProfile,
} from "@/lib/booking/custom-host";
import { getPublicAppUrl } from "@/lib/url/app";

function bookingBaseOrigin(profile: CustomBookingHostProfile): string {
  if (hasVerifiedCustomBookingHost(profile)) {
    return `https://${normalizeBookingHost(profile.customBookingHost)!}`;
  }
  return getPublicAppUrl();
}

/** Public booking page URL — custom verified host uses root; otherwise /book/{slug}. */
export function getBookingPageUrlForProfile(profile: CustomBookingHostProfile): string {
  const slug = profile.publicSlug.trim();
  if (!slug) return "";
  if (hasVerifiedCustomBookingHost(profile)) {
    return bookingBaseOrigin(profile);
  }
  return `${getPublicAppUrl()}/book/${slug}`;
}

export function getBookingEmbedUrlForProfile(profile: CustomBookingHostProfile): string {
  const slug = profile.publicSlug.trim();
  if (!slug) return "";
  if (hasVerifiedCustomBookingHost(profile)) {
    return `${bookingBaseOrigin(profile)}/embed`;
  }
  return `${getPublicAppUrl()}/book/${slug}/embed`;
}

export function getBookingConfirmationUrlForProfile(
  profile: CustomBookingHostProfile,
  bookingRequestId: string,
): string {
  const slug = profile.publicSlug.trim();
  if (!slug || !bookingRequestId) return "";
  if (hasVerifiedCustomBookingHost(profile)) {
    return `${bookingBaseOrigin(profile)}/confirmation/${bookingRequestId}`;
  }
  return `${getPublicAppUrl()}/book/${slug}/confirmation/${bookingRequestId}`;
}

export function getBookingCancelPathForProfile(
  profile: CustomBookingHostProfile,
): string {
  const slug = profile.publicSlug.trim();
  if (!slug) return "/";
  if (hasVerifiedCustomBookingHost(profile)) {
    return "/?error=payment_cancelled";
  }
  return `/book/${slug}?error=payment_cancelled`;
}

export function getBookingConfirmationPathForProfile(
  profile: CustomBookingHostProfile,
  bookingRequestId: string,
): string {
  const slug = profile.publicSlug.trim();
  if (!slug || !bookingRequestId) return "/";
  if (hasVerifiedCustomBookingHost(profile)) {
    return `/confirmation/${bookingRequestId}?payment=success`;
  }
  return `/book/${slug}/confirmation/${bookingRequestId}?payment=success`;
}

/** True when verified custom host differs from NEXT_PUBLIC_APP_URL hostname. */
export function isCustomHostAppUrlMismatch(profile: CustomBookingHostProfile): boolean {
  if (!hasVerifiedCustomBookingHost(profile)) return false;
  const appHost = getAppHostname();
  const customHost = normalizeBookingHost(profile.customBookingHost);
  if (!appHost || !customHost) return false;
  return appHost !== customHost;
}

export function getBookingEmbedHtmlForProfile(profile: CustomBookingHostProfile): string {
  const src = getBookingEmbedUrlForProfile(profile);
  if (!src) return "";
  return `<iframe src="${src}" width="100%" height="720" style="border:0;border-radius:12px" title="Book online"></iframe>`;
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import {
  clearPortalSessionCookie,
  getPortalSessionFromCookies,
  setPortalSessionCookie,
} from "@/lib/portal/session";
import {
  cancelBookingFromPortal,
  getPortalDashboardData,
  requestCustomerPortalMagicLink,
  verifyCustomerPortalMagicLink,
} from "@/server/services/customer-portal";
import { portalEmailSchema } from "@/server/validators/customer-portal";

export async function requestPortalMagicLinkAction(formData: FormData): Promise<void> {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const parsed = portalEmailSchema.safeParse({ email: formData.get("email") });
  const hdrs = await headers();
  const ip = rateLimitKeyFromHeaders(hdrs);

  if (!parsed.success || !businessSlug) {
    redirect(`/my/${businessSlug}?error=${encodeURIComponent("Enter a valid email address.")}`);
  }

  const result = await requestCustomerPortalMagicLink(businessSlug, parsed.data.email, ip);
  if (!result.ok) {
    redirect(`/my/${businessSlug}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/my/${businessSlug}?sent=1`);
}

export async function portalLogoutAction(formData: FormData): Promise<void> {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  await clearPortalSessionCookie();
  redirect(businessSlug ? `/my/${businessSlug}` : "/");
}

export async function cancelPortalBookingAction(formData: FormData): Promise<void> {
  const bookingRequestId = String(formData.get("bookingRequestId") ?? "");
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const session = await getPortalSessionFromCookies();

  if (!session || session.businessSlug !== businessSlug) {
    redirect(`/my/${businessSlug}?error=${encodeURIComponent("Please sign in again.")}`);
  }

  const result = await cancelBookingFromPortal(session, bookingRequestId);
  const param = result.ok ? "cancelled=1" : `error=${encodeURIComponent(result.error)}`;
  revalidatePath(`/my/${businessSlug}/dashboard`);
  redirect(`/my/${businessSlug}/dashboard?${param}`);
}

export async function getPortalDashboardForSession(businessSlug: string) {
  const session = await getPortalSessionFromCookies();
  if (!session || session.businessSlug !== businessSlug) return null;
  return getPortalDashboardData(session);
}

export async function establishPortalSession(businessSlug: string, token: string) {
  const result = await verifyCustomerPortalMagicLink(businessSlug, token);
  if (!result.ok) return result;
  await setPortalSessionCookie(result.session);
  return { ok: true as const };
}

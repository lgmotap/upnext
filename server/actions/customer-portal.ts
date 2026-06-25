"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { rescheduleBySlotSchema } from "@/server/validators/scheduling";
import { rateLimitKeyFromHeaders } from "@/lib/rate-limit";
import {
  clearPortalSessionCookie,
  getPortalSessionFromCookies,
  setPortalSessionCookie,
} from "@/lib/portal/session";
import {
  cancelBookingFromPortal,
  getPortalDashboardData,
  getPortalRescheduleDays,
  getPortalRescheduleSlots,
  requestCustomerPortalMagicLink,
  rescheduleBookingFromPortal,
  verifyCustomerPortalMagicLink,
} from "@/server/services/customer-portal";
import {
  requestPortalPasswordReset,
  signInPortalWithPassword,
} from "@/server/services/portal-auth";
import {
  createSaveCardCheckoutSession,
  payPortalPaymentWithSavedCard,
} from "@/server/services/portal-payments";
import { portalEmailSchema, portalPasswordSchema } from "@/server/validators/customer-portal";

import type { SlotDay } from "@/lib/availability/slots";

function formatTime12h(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

async function requirePortalSession(businessSlug: string) {
  const session = await getPortalSessionFromCookies();
  if (!session || session.businessSlug !== businessSlug) return null;
  return session;
}

export async function fetchPortalRescheduleDaysAction(
  bookingRequestId: string,
  businessSlug: string,
) {
  const session = await requirePortalSession(businessSlug);
  if (!session) return { days: [] as SlotDay[], timeZone: "America/New_York" };

  const result = await getPortalRescheduleDays(session, bookingRequestId);
  if (!result) return { days: [] as SlotDay[], timeZone: "America/New_York" };
  return result;
}

export async function fetchPortalRescheduleSlotsAction(
  bookingRequestId: string,
  businessSlug: string,
  dateYmd: string,
) {
  const session = await requirePortalSession(businessSlug);
  if (!session) return { slots: [] as { date: string; time: string; label: string }[] };

  const slots = await getPortalRescheduleSlots(session, bookingRequestId, dateYmd);
  if (!slots) return { slots: [] as { date: string; time: string; label: string }[] };
  return {
    slots: slots.map((s) => ({ date: s.date, time: s.time, label: formatTime12h(s.time) })),
  };
}

export async function rescheduleFromPortalAction(formData: FormData): Promise<void> {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const session = await requirePortalSession(businessSlug);
  if (!session) {
    redirect(`/my/${businessSlug}?error=${encodeURIComponent("Please sign in again.")}`);
  }

  const bookingRequestId = String(formData.get("bookingRequestId") ?? "");
  const parsed = rescheduleBySlotSchema.safeParse({
    date: formData.get("date"),
    time: formData.get("time"),
  });

  if (!parsed.success || !bookingRequestId) {
    redirect(`/my/${businessSlug}/dashboard?error=${encodeURIComponent("Please pick a valid time.")}`);
  }

  const result = await rescheduleBookingFromPortal(
    session,
    bookingRequestId,
    parsed.data.date,
    parsed.data.time,
  );
  const param = result.ok ? "rescheduled=1" : `error=${encodeURIComponent(result.error)}`;
  revalidatePath(`/my/${businessSlug}/dashboard`);
  redirect(`/my/${businessSlug}/dashboard?${param}`);
}

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

export async function signInPortalPasswordAction(formData: FormData): Promise<void> {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const parsed = portalPasswordSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  const hdrs = await headers();
  const ip = rateLimitKeyFromHeaders(hdrs);

  if (!parsed.success || !businessSlug) {
    redirect(`/my/${businessSlug}?error=${encodeURIComponent("Enter a valid email and password.")}`);
  }

  const result = await signInPortalWithPassword(
    businessSlug,
    parsed.data.email,
    parsed.data.password,
    ip,
  );
  if (!result.ok) {
    redirect(`/my/${businessSlug}?error=${encodeURIComponent(result.error)}`);
  }

  await setPortalSessionCookie(result.session);
  redirect(`/my/${businessSlug}/dashboard`);
}

export async function requestPortalPasswordResetAction(formData: FormData): Promise<void> {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const parsed = portalEmailSchema.safeParse({ email: formData.get("email") });
  const hdrs = await headers();
  const ip = rateLimitKeyFromHeaders(hdrs);

  if (!parsed.success || !businessSlug) {
    redirect(
      `/my/${businessSlug}/forgot-password?error=${encodeURIComponent("Enter a valid email address.")}`,
    );
  }

  const result = await requestPortalPasswordReset(businessSlug, parsed.data.email, ip);
  if (!result.ok) {
    redirect(`/my/${businessSlug}/forgot-password?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/my/${businessSlug}/forgot-password?sent=1`);
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

export async function addPortalCardAction(formData: FormData): Promise<void> {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const session = await getPortalSessionFromCookies();

  if (!session || session.businessSlug !== businessSlug) {
    redirect(`/my/${businessSlug}?error=${encodeURIComponent("Please sign in again.")}`);
  }

  const result = await createSaveCardCheckoutSession(session);
  if (!result.ok) {
    redirect(
      `/my/${businessSlug}/dashboard?tab=payments&error=${encodeURIComponent(result.error)}`,
    );
  }

  redirect(result.url);
}

export async function payWithSavedCardAction(formData: FormData): Promise<void> {
  const businessSlug = String(formData.get("businessSlug") ?? "");
  const paymentRecordId = String(formData.get("paymentRecordId") ?? "");
  const paymentMethodId = String(formData.get("paymentMethodId") ?? "");
  const session = await getPortalSessionFromCookies();

  if (!session || session.businessSlug !== businessSlug) {
    redirect(`/my/${businessSlug}?error=${encodeURIComponent("Please sign in again.")}`);
  }

  const result = await payPortalPaymentWithSavedCard(session, paymentRecordId, paymentMethodId);
  const param = result.ok
    ? "paid=1"
    : `error=${encodeURIComponent(result.error)}`;
  revalidatePath(`/my/${businessSlug}/dashboard`);
  redirect(`/my/${businessSlug}/dashboard?tab=payments&${param}`);
}

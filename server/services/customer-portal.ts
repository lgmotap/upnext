import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { getPublicAppUrl } from "@/lib/url/app";
import { createBookingPrefillToken, type BookingPrefillDetails } from "@/lib/portal/prefill-token";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createCustomerPortalToken,
  findCustomerByEmailForOrg,
  getCustomerPortalProfile,
  getCustomerPortalToken,
  listCustomerOutstandingPayments,
  listCustomerPortalBookings,
  markCustomerPortalTokenUsed,
  purgeExpiredPortalTokens,
  updateCustomerPortalLastLogin,
} from "@/server/repositories/customer-portal";
import { getBusinessProfileBySlug, listPublicPrimaryServicesForOrg } from "@/server/repositories/services";
import { ensureIndustryCatalogForOrg } from "@/server/services/industry-catalog";
import { updateBookingRequestStatus } from "@/server/repositories/bookings";
import { updateJobStatus } from "@/server/services/jobs";
import { pauseJobSeries } from "@/server/services/recurring-jobs";
import {
  canCustomerCancelBooking,
  canCustomerRescheduleBooking,
  portalCancelBlockedMessage,
  portalRescheduleBlockedMessage,
} from "@/lib/portal/cancel-policy";
import {
  getRescheduleDaysForBooking,
  getRescheduleDaysForJob,
  getRescheduleSlotsForBooking,
  getRescheduleSlotsForJob,
  rescheduleBookingRequest,
  rescheduleJob,
} from "@/server/services/scheduling";
import {
  notifyBookingCancelledByCustomer,
  notifyCustomerPortalLink,
} from "@/server/services/notifications";
import { emitOrgWebhook } from "@/server/services/webhooks";
import type { PortalSession } from "@/lib/portal/session";
import { isCustomerPortalEnabled } from "@/lib/portal/enabled";
import { ensurePortalFaqDefaults, getPortalFaqFromProfile } from "@/server/services/portal-faq";
import { ensurePortalSupabaseUser } from "@/server/services/portal-auth";
import {
  isPortalStripePaymentsEnabled,
  listSavedPaymentMethods,
} from "@/server/services/portal-payments";

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function loadPortalContext(businessSlug: string) {
  const profile = await getBusinessProfileBySlug(businessSlug);
  if (!profile || !isCustomerPortalEnabled(profile)) return null;
  return profile;
}

export async function requestCustomerPortalMagicLink(
  businessSlug: string,
  email: string,
  rateLimitKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!checkRateLimit(`portal:ip:${rateLimitKey}`, 10, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many requests. Try again in an hour." };
  }

  const normalized = normalizeEmail(email);
  if (!normalized) return { ok: false, error: "Enter your email address." };

  if (!checkRateLimit(`portal:email:${businessSlug}:${normalized}`, 5, 60 * 60 * 1000)) {
    return { ok: false, error: "Too many sign-in attempts for this email. Try again later." };
  }

  const profile = await loadPortalContext(businessSlug);
  if (!profile) return { ok: false, error: "Customer portal is not available for this business." };

  const customer = await findCustomerByEmailForOrg(profile.organizationId, normalized);
  if (!customer) {
    // Avoid email enumeration — same success message
    return { ok: true };
  }

  await purgeExpiredPortalTokens();
  await prisma.customerPortalToken.deleteMany({
    where: {
      organizationId: profile.organizationId,
      customerId: customer.id,
      usedAt: null,
    },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);

  const record = await createCustomerPortalToken({
    organizationId: profile.organizationId,
    customerId: customer.id,
    token,
    expiresAt,
  });

  const authUrl = `${getPublicAppUrl()}/my/${businessSlug}/auth/${token}`;
  await notifyCustomerPortalLink({
    organizationId: profile.organizationId,
    customerId: customer.id,
    tokenId: record.id,
    customerEmail: customer.email,
    customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    businessName: profile.displayName,
    authUrl,
  });

  if (profile.portalPasswordLoginEnabled) {
    await ensurePortalSupabaseUser({
      organizationId: profile.organizationId,
      customerId: customer.id,
      email: customer.email,
      businessSlug,
      sendPasswordSetup: !customer.portalUserId,
    });
  }

  return { ok: true };
}

export async function verifyCustomerPortalMagicLink(
  businessSlug: string,
  token: string,
): Promise<{ ok: true; session: Omit<PortalSession, "exp"> } | { ok: false; error: string }> {
  const profile = await loadPortalContext(businessSlug);
  if (!profile) return { ok: false, error: "Portal not available." };

  const row = await getCustomerPortalToken(token);
  if (!row || row.organizationId !== profile.organizationId) {
    return { ok: false, error: "This sign-in link is invalid." };
  }
  if (row.expiresAt < new Date()) return { ok: false, error: "This sign-in link has expired." };
  if (row.organization.businessProfile?.publicSlug !== businessSlug) {
    return { ok: false, error: "Invalid portal link." };
  }

  if (!row.usedAt) {
    await markCustomerPortalTokenUsed(row.id);
  }
  await updateCustomerPortalLastLogin(row.customerId, row.organizationId);

  return {
    ok: true,
    session: {
      customerId: row.customerId,
      organizationId: row.organizationId,
      businessSlug,
    },
  };
}

export async function sendCustomerPortalLinkFromOwner(
  organizationId: string,
  customerId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await prisma.businessProfile.findUnique({
    where: { organizationId },
  });
  if (!profile || !isCustomerPortalEnabled(profile)) {
    return { ok: false, error: "Enable the customer portal in Settings → Portals first." };
  }

  const customer = await getCustomerPortalProfile(organizationId, customerId);
  if (!customer) return { ok: false, error: "Customer not found." };

  await purgeExpiredPortalTokens();
  await prisma.customerPortalToken.deleteMany({
    where: { organizationId, customerId, usedAt: null },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MS);
  const record = await createCustomerPortalToken({
    organizationId,
    customerId,
    token,
    expiresAt,
  });

  const authUrl = `${getPublicAppUrl()}/my/${profile.publicSlug}/auth/${token}`;
  await notifyCustomerPortalLink({
    organizationId,
    customerId,
    tokenId: record.id,
    customerEmail: customer.email,
    customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    businessName: profile.displayName,
    authUrl,
  });

  if (profile.portalPasswordLoginEnabled) {
    await ensurePortalSupabaseUser({
      organizationId,
      customerId,
      email: customer.email,
      businessSlug: profile.publicSlug,
      sendPasswordSetup: !customer.portalUserId,
    });
  }

  return { ok: true };
}

export function customerToPrefill(customer: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  notes: string | null;
  addresses: Array<{
    line1: string;
    line2: string | null;
    city: string;
    region: string;
    postalCode: string;
  }>;
}): BookingPrefillDetails {
  const addr = customer.addresses[0];
  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone ?? "",
    line1: addr?.line1 ?? "",
    line2: addr?.line2 ?? "",
    city: addr?.city ?? "",
    region: addr?.region ?? "",
    postalCode: addr?.postalCode ?? "",
    customerNotes: customer.notes ?? "",
  };
}

export async function getCustomerPrefillForPortal(
  organizationId: string,
  customerId: string,
): Promise<BookingPrefillDetails | null> {
  const customer = await getCustomerPortalProfile(organizationId, customerId);
  if (!customer) return null;
  return customerToPrefill(customer);
}

export function createPrefillLink(
  publicSlug: string,
  customerId: string,
  organizationId: string,
  options?: { serviceId?: string },
) {
  const token = createBookingPrefillToken(customerId, organizationId);
  const url = new URL(`${getPublicAppUrl()}/book/${publicSlug}`);
  url.searchParams.set("prefill", token);
  if (options?.serviceId) {
    url.searchParams.set("serviceId", options.serviceId);
  }
  return url.toString();
}

export async function getPortalDashboardData(session: PortalSession) {
  const profile = await getBusinessProfileBySlug(session.businessSlug);
  if (!profile || profile.organizationId !== session.organizationId) return null;

  const customer = await getCustomerPortalProfile(session.organizationId, session.customerId);
  if (!customer) return null;

  let primaryServices = await listPublicPrimaryServicesForOrg(session.organizationId);
  if (primaryServices.length === 0) {
    await ensureIndustryCatalogForOrg(session.organizationId);
    primaryServices = await listPublicPrimaryServicesForOrg(session.organizationId);
  }

  const [bookings, payments] = await Promise.all([
    listCustomerPortalBookings(session.organizationId, session.customerId),
    listCustomerOutstandingPayments(session.organizationId, session.customerId),
  ]);

  const minNoticeHours = profile.minNoticeHours ?? 24;
  const stripePaymentsEnabled = await isPortalStripePaymentsEnabled(session.organizationId);
  const savedPaymentMethods = stripePaymentsEnabled
    ? await listSavedPaymentMethods(session.organizationId, session.customerId)
    : [];

  const bookingsWithPolicy = bookings.map((b) => ({
    ...b,
    canCancel: canCustomerCancelBooking(b, minNoticeHours),
    canReschedule: canCustomerRescheduleBooking(b, minNoticeHours),
  }));

  const cleaningPlan = buildPortalCleaningPlan(bookingsWithPolicy);

  await ensurePortalFaqDefaults(session.organizationId);
  const faq = getPortalFaqFromProfile(profile);

  return {
    businessName: profile.displayName,
    customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    bookings: bookingsWithPolicy,
    payments: payments.filter(
      (p): p is typeof p & { job: NonNullable<(typeof p)["job"]> } => p.job != null,
    ),
    minNoticeHours,
    stripePaymentsEnabled,
    savedPaymentMethods,
    prefill: customerToPrefill(customer),
    bookAgainUrl: createPrefillLink(profile.publicSlug, customer.id, session.organizationId),
    faq,
    cleaningPlan,
    primaryServices: primaryServices.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMinutes: s.durationMinutes,
      basePriceCents: s.basePriceCents,
      currency: s.currency,
      iconKey: s.iconKey,
    })),
  };
}

export async function cancelBookingFromPortal(
  session: PortalSession,
  bookingRequestId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getBusinessProfileBySlug(session.businessSlug);
  if (!profile || profile.organizationId !== session.organizationId) {
    return { ok: false, error: "Portal not available." };
  }

  const minNoticeHours = profile.minNoticeHours ?? 24;

  const booking = await prisma.bookingRequest.findFirst({
    where: {
      id: bookingRequestId,
      organizationId: session.organizationId,
      customerId: session.customerId,
    },
    include: { job: { select: { id: true, status: true, jobSeriesId: true } } },
  });

  if (!booking) return { ok: false, error: "Booking not found." };
  if (!canCustomerCancelBooking(booking, minNoticeHours)) {
    return { ok: false, error: portalCancelBlockedMessage(minNoticeHours) };
  }

  if (booking.status === "pending") {
    await updateBookingRequestStatus(session.organizationId, bookingRequestId, "cancelled");
  } else {
    await prisma.bookingRequest.update({
      where: { id: bookingRequestId },
      data: { status: "cancelled" },
    });
  }

  if (booking.job && !["completed", "cancelled"].includes(booking.job.status)) {
    await updateJobStatus(session.organizationId, booking.job.id, "cancelled");
  }

  if (booking.job?.jobSeriesId) {
    await pauseJobSeries(session.organizationId, booking.job.jobSeriesId);
  } else if (booking.frequency !== "one_time" && booking.job) {
    const series = await prisma.jobSeries.findFirst({
      where: { organizationId: session.organizationId, anchorJobId: booking.job.id },
      select: { id: true },
    });
    if (series) await pauseJobSeries(session.organizationId, series.id);
  }

  await notifyBookingCancelledByCustomer(session.organizationId, bookingRequestId);
  emitOrgWebhook(session.organizationId, "booking_canceled", {
    bookingRequestId,
    source: "customer_portal",
  });
  return { ok: true };
}

const FREQUENCY_LABELS: Record<string, string> = {
  one_time: "One-time",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

function buildPortalCleaningPlan(
  bookings: Awaited<ReturnType<typeof listCustomerPortalBookings>>,
) {
  const now = new Date();
  const upcoming = bookings.filter(
    (b) =>
      ["pending", "accepted"].includes(b.status) && new Date(b.requestedStartAt) > now,
  );
  const ref = upcoming[0] ?? bookings[0];
  if (!ref) return null;

  const addr = ref.job?.customerAddress ?? ref.customer.addresses[0] ?? null;
  const addressLine = addr
    ? `${addr.line1}, ${addr.city}, ${addr.region} ${addr.postalCode}`
    : null;
  if (!addressLine) return null;

  const next = upcoming[0];
  return {
    serviceName: ref.service.name,
    addonNames: ref.addons.map((a) => a.name),
    frequency: FREQUENCY_LABELS[ref.frequency] ?? ref.frequency,
    addressLine,
    nextVisitAt: next ? next.requestedStartAt : null,
  };
}

async function getPortalBookingForSession(session: PortalSession, bookingRequestId: string) {
  return prisma.bookingRequest.findFirst({
    where: {
      id: bookingRequestId,
      organizationId: session.organizationId,
      customerId: session.customerId,
    },
    include: { job: { select: { id: true, status: true } } },
  });
}

export async function getPortalRescheduleDays(session: PortalSession, bookingRequestId: string) {
  const profile = await getBusinessProfileBySlug(session.businessSlug);
  if (!profile || profile.organizationId !== session.organizationId) return null;

  const booking = await getPortalBookingForSession(session, bookingRequestId);
  if (!booking) return null;

  const minNoticeHours = profile.minNoticeHours ?? 24;
  if (!canCustomerRescheduleBooking(booking, minNoticeHours)) return null;

  if (booking.job && !["completed", "cancelled"].includes(booking.job.status)) {
    return getRescheduleDaysForJob(session.organizationId, booking.job.id);
  }
  if (booking.status === "pending") {
    return getRescheduleDaysForBooking(session.organizationId, bookingRequestId);
  }
  return null;
}

export async function getPortalRescheduleSlots(
  session: PortalSession,
  bookingRequestId: string,
  dateYmd: string,
) {
  const profile = await getBusinessProfileBySlug(session.businessSlug);
  if (!profile || profile.organizationId !== session.organizationId) return null;

  const booking = await getPortalBookingForSession(session, bookingRequestId);
  if (!booking) return null;

  const minNoticeHours = profile.minNoticeHours ?? 24;
  if (!canCustomerRescheduleBooking(booking, minNoticeHours)) return null;

  if (booking.job && !["completed", "cancelled"].includes(booking.job.status)) {
    return getRescheduleSlotsForJob(session.organizationId, booking.job.id, dateYmd);
  }
  if (booking.status === "pending") {
    return getRescheduleSlotsForBooking(session.organizationId, bookingRequestId, dateYmd);
  }
  return null;
}

export async function rescheduleBookingFromPortal(
  session: PortalSession,
  bookingRequestId: string,
  dateYmd: string,
  timeHm: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getBusinessProfileBySlug(session.businessSlug);
  if (!profile || profile.organizationId !== session.organizationId) {
    return { ok: false, error: "Portal not available." };
  }

  const minNoticeHours = profile.minNoticeHours ?? 24;
  const booking = await getPortalBookingForSession(session, bookingRequestId);
  if (!booking) return { ok: false, error: "Booking not found." };

  if (!canCustomerRescheduleBooking(booking, minNoticeHours)) {
    return { ok: false, error: portalRescheduleBlockedMessage(minNoticeHours) };
  }

  if (booking.job && !["completed", "cancelled"].includes(booking.job.status)) {
    const result = await rescheduleJob(
      session.organizationId,
      booking.job.id,
      dateYmd,
      timeHm,
    );
    return result.ok ? { ok: true } : result;
  }

  if (booking.status === "pending") {
    const result = await rescheduleBookingRequest(
      session.organizationId,
      bookingRequestId,
      dateYmd,
      timeHm,
    );
    return result.ok ? { ok: true } : result;
  }

  return { ok: false, error: "This booking cannot be rescheduled online." };
}

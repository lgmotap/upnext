import { prisma } from "@/lib/db/prisma";
import { appBaseUrl, getStripe } from "@/lib/stripe/client";
import { getBusinessProfileBySlug } from "@/server/repositories/services";
import { getOrgStripeConnect } from "@/server/repositories/payments";
import { getCustomBookingHostForOrg } from "@/server/repositories/custom-booking-host";
import { createJobFromBookingRequest } from "@/server/services/jobs";
import { isPortalStripePaymentsEnabled } from "@/server/services/portal-payments";
import {
  getBookingCancelPathForProfile,
  getBookingConfirmationPathForProfile,
} from "@/lib/url/booking";
import { hasVerifiedCustomBookingHost } from "@/lib/booking/custom-host";

export async function getPayAtBookingSettingsForOrg(organizationId: string) {
  return prisma.businessProfile.findUnique({
    where: { organizationId },
    select: {
      payAtBookingEnabled: true,
      requirePaymentAtBooking: true,
      publicSlug: true,
    },
  });
}

export async function isPayAtBookingAvailable(organizationId: string): Promise<boolean> {
  const [profile, stripeReady] = await Promise.all([
    getPayAtBookingSettingsForOrg(organizationId),
    isPortalStripePaymentsEnabled(organizationId),
  ]);
  return Boolean(profile?.payAtBookingEnabled && stripeReady);
}

export async function updatePayAtBookingSettings(
  organizationId: string,
  data: { payAtBookingEnabled: boolean; requirePaymentAtBooking: boolean },
) {
  await prisma.businessProfile.update({
    where: { organizationId },
    data: {
      payAtBookingEnabled: data.payAtBookingEnabled,
      requirePaymentAtBooking: data.requirePaymentAtBooking,
    },
  });
}

export async function createBookingCheckoutSession(data: {
  organizationId: string;
  businessSlug: string;
  bookingRequestId: string;
  customerId: string;
  customerEmail: string;
  serviceLabel: string;
  amountCents: number;
  currency: string;
  successPath?: string;
  cancelPath?: string;
}) {
  const stripe = getStripe();
  if (!stripe) return { ok: false as const, error: "Stripe is not configured" };

  const org = await getOrgStripeConnect(data.organizationId);
  if (!org?.stripeConnectAccountId || !org.stripeConnectChargesEnabled) {
    return { ok: false as const, error: "Stripe Connect is not ready" };
  }

  const existing = await prisma.paymentRecord.findFirst({
    where: { bookingRequestId: data.bookingRequestId, organizationId: data.organizationId },
  });
  if (existing?.status === "paid") {
    return { ok: false as const, error: "This booking is already paid" };
  }

  const payment =
    existing ??
    (await prisma.paymentRecord.create({
      data: {
        organizationId: data.organizationId,
        bookingRequestId: data.bookingRequestId,
        customerId: data.customerId,
        amountCents: data.amountCents,
        currency: data.currency,
        status: "pending",
        provider: "stripe",
      },
    }));

  const hostProfile = await getCustomBookingHostForOrg(data.organizationId);
  const bookingProfile = {
    publicSlug: data.businessSlug,
    customBookingHost: hostProfile?.customBookingHost ?? null,
    customBookingVerifiedAt: hostProfile?.customBookingVerifiedAt ?? null,
  };

  const base = hasVerifiedCustomBookingHost(bookingProfile)
    ? `https://${bookingProfile.customBookingHost}`
    : appBaseUrl();
  const successPath =
    data.successPath ?? getBookingConfirmationPathForProfile(bookingProfile, data.bookingRequestId);
  const cancelPath = data.cancelPath ?? getBookingCancelPathForProfile(bookingProfile);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: data.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: data.currency.toLowerCase(),
          unit_amount: data.amountCents,
          product_data: { name: data.serviceLabel },
        },
      },
    ],
    payment_intent_data: {
      transfer_data: {
        destination: org.stripeConnectAccountId,
      },
      metadata: {
        organizationId: data.organizationId,
        bookingRequestId: data.bookingRequestId,
        paymentRecordId: payment.id,
        payAtBooking: "true",
      },
    },
    metadata: {
      organizationId: data.organizationId,
      bookingRequestId: data.bookingRequestId,
      paymentRecordId: payment.id,
      stripeConnectAccountId: org.stripeConnectAccountId,
      payAtBooking: "true",
    },
    success_url: `${base}${successPath}`,
    cancel_url: `${base}${cancelPath}`,
  });

  await prisma.paymentRecord.update({
    where: { id: payment.id },
    data: {
      status: "pending",
      provider: "stripe",
      stripeCheckoutSessionId: session.id,
      paymentUrl: session.url,
      amountCents: data.amountCents,
    },
  });

  return {
    ok: true as const,
    url: session.url ?? null,
    paymentRecordId: payment.id,
  };
}

export async function fulfillPayAtBookingPayment(paymentRecordId: string, organizationId: string) {
  const payment = await prisma.paymentRecord.findFirst({
    where: { id: paymentRecordId, organizationId },
    select: { bookingRequestId: true, jobId: true, status: true },
  });
  if (!payment?.bookingRequestId || payment.status !== "paid") return { ok: true as const };

  if (payment.jobId) return { ok: true as const, jobId: payment.jobId };

  const booking = await prisma.bookingRequest.findFirst({
    where: { id: payment.bookingRequestId, organizationId },
    select: { status: true },
  });
  if (!booking || booking.status !== "pending") return { ok: true as const };

  const jobResult = await createJobFromBookingRequest(organizationId, payment.bookingRequestId);
  if (!jobResult.ok) return jobResult;

  return { ok: true as const, jobId: jobResult.jobId };
}

export async function loadPublicPayAtBookingContext(businessSlug: string) {
  const profile = await getBusinessProfileBySlug(businessSlug);
  if (!profile) {
    return {
      payAtBookingEnabled: false,
      requirePaymentAtBooking: false,
      stripePaymentsAvailable: false,
      showPaymentStep: false,
    };
  }

  const stripePaymentsAvailable = await isPortalStripePaymentsEnabled(profile.organizationId);
  return {
    payAtBookingEnabled: profile.payAtBookingEnabled,
    requirePaymentAtBooking: profile.requirePaymentAtBooking,
    stripePaymentsAvailable,
    showPaymentStep: profile.payAtBookingEnabled && stripePaymentsAvailable,
  };
}

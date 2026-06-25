/**
 * Pay-at-booking smoke: settings flag + checkout session + webhook fulfillment.
 * Skips gracefully when Stripe env is missing.
 * Run: npm run smoke:pay-at-booking
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const TEST_SLUG = "smoke-pay-at-booking";
const SMOKE_CONNECT_ACCOUNT_ID = "acct_1TlczsRAIBDcdZbR";

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const { isStripeConfigured } = await import("../lib/stripe/client");
  const { saveWeeklyAvailability } = await import("../server/services/availability");
  const { defaultWeeklyRules } = await import("../server/validators/availability");
  const { createPublicBooking, createPublicBookingCheckout } = await import(
    "../server/services/bookings"
  );
  const { getPublicAvailableDays, getPublicSlotsForDay } = await import("../server/services/bookings");
  const { handleStripeWebhookEvent } = await import("../server/services/payments");

  if (!isStripeConfigured()) {
    console.log("⏭️  SKIP pay-at-booking smoke — STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET not set");
    return;
  }

  console.log("▶ Pay at booking smoke\n");

  let org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { businessProfile: true, services: true },
  });

  if (!org) {
    const userId = "smoke-pay-at-booking-user";
    const user = await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email: "smoke-pay-at-booking@upnext.local", name: "Pay Booking Smoke" },
      update: {},
    });

    org = await prisma.organization.create({
      data: {
        name: "Pay At Booking Smoke Co",
        slug: `pay-booking-${randomUUID().slice(0, 8)}`,
        ownerId: user.id,
        timezone: "America/New_York",
        stripeConnectAccountId: SMOKE_CONNECT_ACCOUNT_ID,
        stripeConnectChargesEnabled: true,
        memberships: { create: { userId: user.id, role: "owner", status: "active" } },
        businessProfile: {
          create: {
            displayName: "Pay At Booking Smoke Co",
            publicSlug: TEST_SLUG,
            bookingEnabled: true,
            payAtBookingEnabled: true,
            requirePaymentAtBooking: true,
          },
        },
        services: {
          create: {
            name: "Standard Clean",
            durationMinutes: 120,
            basePriceCents: 15000,
            isActive: true,
            isPublic: true,
          },
        },
      },
      include: { businessProfile: true, services: true },
    });
    console.log("✓ Seeded test org");
  } else {
    await prisma.businessProfile.update({
      where: { organizationId: org.id },
      data: { payAtBookingEnabled: true, requirePaymentAtBooking: true },
    });
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        stripeConnectAccountId: SMOKE_CONNECT_ACCOUNT_ID,
        stripeConnectChargesEnabled: true,
      },
    });
  }

  const service = org.services[0] ?? (await prisma.service.findFirst({ where: { organizationId: org.id } }));
  if (!service) throw new Error("No service");

  await saveWeeklyAvailability(org.id, { rules: defaultWeeklyRules() });

  const days = (await getPublicAvailableDays(TEST_SLUG, service.id))?.days ?? [];
  if (!days[0]) throw new Error("No bookable days");
  const slots = (await getPublicSlotsForDay(TEST_SLUG, service.id, days[0].date)) ?? [];
  if (!slots[0]) throw new Error("No slots");

  const bookingInput = {
    businessSlug: TEST_SLUG,
    serviceId: service.id,
    addonServiceIds: [] as string[],
    date: days[0].date,
    time: slots[0].time,
    firstName: "Pay",
    lastName: "Now",
    email: `pay-booking+${randomUUID().slice(0, 8)}@upnext.local`,
    line1: "1 Test St",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
    frequency: "one_time" as const,
  };

  const offProfile = await prisma.businessProfile.update({
    where: { organizationId: org.id },
    data: { payAtBookingEnabled: false, requirePaymentAtBooking: false },
  });
  void offProfile;

  const normal = await createPublicBooking(bookingInput);
  if (!normal.ok) throw new Error(`Toggle off booking failed: ${normal.error}`);
  console.log("✓ Public booking works with pay-at-booking disabled");

  await prisma.businessProfile.update({
    where: { organizationId: org.id },
    data: { payAtBookingEnabled: true, requirePaymentAtBooking: true },
  });

  const checkout = await createPublicBookingCheckout(bookingInput);
  if (!checkout.ok || !checkout.checkoutUrl) {
    throw new Error(`Checkout failed: ${checkout.ok ? "no url" : checkout.error}`);
  }
  console.log("✓ Created booking + checkout session");

  const payment = await prisma.paymentRecord.findFirst({
    where: { bookingRequestId: checkout.bookingRequestId, organizationId: org.id },
  });
  if (!payment?.stripeCheckoutSessionId) {
    throw new Error("Payment record missing checkout session");
  }

  const eventId = `evt_pay_booking_${Date.now()}`;
  await handleStripeWebhookEvent({
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: payment.stripeCheckoutSessionId,
        object: "checkout.session",
        payment_status: "paid",
        payment_intent: `pi_pay_booking_${Date.now()}`,
        metadata: {
          organizationId: org.id,
          bookingRequestId: checkout.bookingRequestId,
          paymentRecordId: payment.id,
          payAtBooking: "true",
          stripeConnectAccountId: SMOKE_CONNECT_ACCOUNT_ID,
        },
      },
    },
  } as unknown as import("stripe").Stripe.Event);
  console.log("✓ Processed checkout.session.completed webhook");

  const updatedPayment = await prisma.paymentRecord.findUnique({ where: { id: payment.id } });
  if (updatedPayment?.status !== "paid") {
    throw new Error(`Expected paid payment, got ${updatedPayment?.status}`);
  }

  const booking = await prisma.bookingRequest.findUnique({
    where: { id: checkout.bookingRequestId },
    include: { job: true },
  });
  if (booking?.status !== "accepted" || !booking.job) {
    throw new Error("Expected booking accepted with job after payment webhook");
  }
  if (updatedPayment.jobId !== booking.job.id) {
    throw new Error("Payment record not linked to job");
  }

  console.log(`✓ Webhook fulfilled booking → job ${booking.job.id}`);
  console.log("\n✅ Pay at booking smoke passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/db/prisma");
    await prisma.$disconnect();
  });

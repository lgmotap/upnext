/**
 * Smoke: customer portal reschedule within minNoticeHours policy.
 * Run: npm run smoke:portal-reschedule
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { createJobFromBookingRequest } = await import("../server/services/jobs");
const {
  getPortalRescheduleDays,
  rescheduleBookingFromPortal,
} = await import("../server/services/customer-portal");
const { canCustomerRescheduleBooking } = await import("../lib/portal/cancel-policy");
const { getRescheduleSlotsForJob } = await import("../server/services/scheduling");
const { formatYmdInTimezone, formatTimeHmInTimezone } = await import("../lib/datetime/timezone");

const SLUG = "smoke-portal-reschedule";

async function main() {
  console.log("▶ Portal reschedule smoke\n");

  let org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: SLUG } },
    include: { businessProfile: true, services: true },
  });

  if (!org) {
    const user = await prisma.user.upsert({
      where: { id: "smoke-portal-reschedule-user" },
      create: {
        id: "smoke-portal-reschedule-user",
        email: "portal-reschedule@upnext.local",
        name: "Portal Reschedule",
      },
      update: {},
    });

    org = await prisma.organization.create({
      data: {
        name: "Portal Reschedule Co",
        slug: `portal-reschedule-${randomUUID().slice(0, 8)}`,
        ownerId: user.id,
        timezone: "America/New_York",
        memberships: { create: { userId: user.id, role: "owner", status: "active" } },
        businessProfile: {
          create: {
            displayName: "Portal Reschedule Co",
            publicSlug: SLUG,
            bookingEnabled: true,
            customerPortalEnabled: true,
            minNoticeHours: 0,
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
  }

  await saveWeeklyAvailability(org.id, { rules: defaultWeeklyRules() });

  const service = org.services[0]!;
  let customer = await prisma.customer.findFirst({
    where: { organizationId: org.id, email: "reschedule-customer@upnext.local" },
    include: { addresses: true },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        organizationId: org.id,
        firstName: "Reschedule",
        lastName: "Customer",
        email: "reschedule-customer@upnext.local",
        addresses: {
          create: {
            line1: "99 Reschedule Ln",
            city: "Austin",
            region: "TX",
            postalCode: "78701",
            country: "US",
            isDefault: true,
          },
        },
      },
      include: { addresses: true },
    });
  }

  const farFuture = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  farFuture.setUTCHours(14, 0, 0, 0);

  const booking = await prisma.bookingRequest.create({
    data: {
      organizationId: org.id,
      customerId: customer.id,
      serviceId: service.id,
      requestedStartAt: farFuture,
      requestedEndAt: new Date(farFuture.getTime() + 120 * 60_000),
      status: "pending",
      source: "public_booking",
    },
  });

  const accept = await createJobFromBookingRequest(org.id, booking.id);
  if (!accept.ok) throw new Error(accept.error);

  const session = {
    organizationId: org.id,
    customerId: customer.id,
    businessSlug: SLUG,
    exp: Date.now() + 60_000,
  };

  const updatedBooking = await prisma.bookingRequest.findUniqueOrThrow({
    where: { id: booking.id },
    include: { job: { select: { id: true, status: true } } },
  });

  if (!canCustomerRescheduleBooking(updatedBooking, 0)) {
    throw new Error("Expected booking to be reschedulable");
  }
  console.log("✓ Policy allows reschedule");

  const days = await getPortalRescheduleDays(session, booking.id);
  if (!days?.days.length) throw new Error("No reschedule days");
  const targetDate =
    days.days.find((d) => d.date !== formatYmdInTimezone(farFuture, org.timezone))?.date ??
    days.days[0]!.date;
  const slots = await getRescheduleSlotsForJob(org.id, accept.jobId, targetDate);
  if (!slots?.length) throw new Error("No slots on target date");
  const slot = slots.find((s) => s.time !== formatTimeHmInTimezone(farFuture, org.timezone)) ?? slots[0]!;

  const before = updatedBooking.requestedStartAt.toISOString();
  const result = await rescheduleBookingFromPortal(session, booking.id, slot.date, slot.time);
  if (!result.ok) throw new Error(result.error);

  const after = await prisma.bookingRequest.findUniqueOrThrow({ where: { id: booking.id } });
  if (after.requestedStartAt.toISOString() === before) {
    throw new Error("requestedStartAt unchanged after portal reschedule");
  }
  console.log(`✓ Rescheduled to ${slot.date} ${slot.time}`);

  console.log("\n✅ Portal reschedule smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

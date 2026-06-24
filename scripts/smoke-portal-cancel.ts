/**
 * Smoke: customer portal cancel with minNoticeHours policy.
 * Run: npm run smoke:portal-cancel
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { saveWeeklyAvailability } = await import("../server/services/availability");
const { defaultWeeklyRules } = await import("../server/validators/availability");
const { createJobFromBookingRequest } = await import("../server/services/jobs");
const { cancelBookingFromPortal } = await import("../server/services/customer-portal");
const { canCustomerCancelBooking } = await import("../lib/portal/cancel-policy");

const SLUG = "smoke-portal-cancel";

async function main() {
  console.log("▶ Portal cancel smoke\n");

  let org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: SLUG } },
    include: { businessProfile: true, services: true },
  });

  if (!org) {
    const user = await prisma.user.upsert({
      where: { id: "smoke-portal-cancel-user" },
      create: { id: "smoke-portal-cancel-user", email: "portal-cancel@upnext.local", name: "Portal Cancel" },
      update: {},
    });

    org = await prisma.organization.create({
      data: {
        name: "Portal Cancel Co",
        slug: `portal-cancel-${randomUUID().slice(0, 8)}`,
        ownerId: user.id,
        timezone: "America/New_York",
        memberships: { create: { userId: user.id, role: "owner", status: "active" } },
        businessProfile: {
          create: {
            displayName: "Portal Cancel Co",
            publicSlug: SLUG,
            bookingEnabled: true,
            customerPortalEnabled: true,
            minNoticeHours: 24,
          },
        },
        services: {
          create: {
            name: "Standard Clean",
            durationMinutes: 60,
            basePriceCents: 10000,
            isActive: true,
            isPublic: true,
          },
        },
      },
      include: { businessProfile: true, services: true },
    });
    console.log("✓ Seeded org");
  }

  const service = org.services[0];
  if (!service) throw new Error("No service");

  await saveWeeklyAvailability(org.id, { rules: defaultWeeklyRules() });

  let customer = await prisma.customer.findFirst({
    where: { organizationId: org.id, email: "cancel-test@example.com" },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        organizationId: org.id,
        firstName: "Cancel",
        lastName: "Tester",
        email: "cancel-test@example.com",
        addresses: {
          create: {
            line1: "1 Main St",
            city: "Austin",
            region: "TX",
            postalCode: "78701",
            isDefault: true,
          },
        },
      },
    });
  }

  const futureStart = new Date(Date.now() + 72 * 60 * 60 * 1000);
  futureStart.setMinutes(0, 0, 0);
  const futureEnd = new Date(futureStart.getTime() + 60 * 60 * 1000);

  const booking = await prisma.bookingRequest.create({
    data: {
      organizationId: org.id,
      customerId: customer.id,
      serviceId: service.id,
      requestedStartAt: futureStart,
      requestedEndAt: futureEnd,
      status: "pending",
      source: "manual",
    },
  });

  const jobResult = await createJobFromBookingRequest(org.id, booking.id);
  if (!jobResult.ok) throw new Error(jobResult.error);

  const session = {
    customerId: customer.id,
    organizationId: org.id,
    businessSlug: SLUG,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  if (!canCustomerCancelBooking({ status: "accepted", requestedStartAt: futureStart }, 24)) {
    throw new Error("Expected booking to be cancellable");
  }

  const cancel = await cancelBookingFromPortal(session, booking.id);
  if (!cancel.ok) throw new Error(cancel.error);

  const updated = await prisma.bookingRequest.findUnique({ where: { id: booking.id } });
  const job = await prisma.job.findUnique({ where: { id: jobResult.jobId } });
  if (updated?.status !== "cancelled") throw new Error("Booking not cancelled");
  if (job?.status !== "cancelled") throw new Error("Job not cancelled");

  console.log("✓ Accepted booking + job cancelled from portal");
  console.log("\n✅ Portal cancel smoke passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

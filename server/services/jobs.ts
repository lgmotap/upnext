import { prisma } from "@/lib/db/prisma";
import { getBookingRequestForOrg } from "@/server/repositories/bookings";
import { listPricingParametersForService } from "@/server/repositories/pricing-parameters";
import { bookingPriceCents } from "@/lib/pricing/parameters";
import type { PricingParameterType } from "@/generated/prisma/client";
import { notifyBookingAccepted, notifyJobCompleted } from "@/server/services/notifications";
import { createJobSeriesFromAcceptedJob } from "@/server/services/recurring-jobs";
import { seedJobChecklistItems } from "@/server/services/checklists";
import { captureServerEvent } from "@/lib/posthog/server";
import { AnalyticsEvents } from "@/lib/posthog/events";

export async function createJobFromBookingRequest(organizationId: string, bookingRequestId: string) {
  const booking = await getBookingRequestForOrg(organizationId, bookingRequestId);
  if (!booking || booking.status !== "pending") return { ok: false as const, error: "Booking not found or already handled" };

  const existingJob = await prisma.job.findUnique({ where: { bookingRequestId } });
  if (existingJob) return { ok: false as const, error: "Job already exists for this booking" };

  const address = booking.customer.addresses[0] ?? null;
  const addonTotal = (booking.addons ?? []).reduce((sum, a) => sum + a.priceCents, 0);
  const paramConfigs = await listPricingParametersForService(booking.serviceId);
  const paramValues = Object.fromEntries(
    (booking.parameters ?? []).map((p) => [p.parameterType, p.units]),
  ) as Partial<Record<PricingParameterType, number>>;
  const priceCents = bookingPriceCents(
    booking.service.basePriceCents,
    addonTotal,
    paramConfigs,
    paramValues,
  );
  const title =
    booking.addons && booking.addons.length > 0
      ? `${booking.service.name} + ${booking.addons.map((a) => a.name).join(", ")}`
      : booking.service.name;

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.job.create({
      data: {
        organizationId,
        bookingRequestId,
        customerId: booking.customerId,
        customerAddressId: address?.id ?? null,
        serviceId: booking.serviceId,
        title,
        scheduledStartAt: booking.requestedStartAt,
        scheduledEndAt: booking.requestedEndAt,
        status: "scheduled",
        priceCents,
        currency: booking.service.currency,
        customerNotes: booking.customerNotes,
      },
    });

    await tx.bookingRequest.update({
      where: { id: bookingRequestId },
      data: { status: "accepted" },
    });

    await tx.paymentRecord.create({
      data: {
        organizationId,
        jobId: created.id,
        customerId: booking.customerId,
        amountCents: priceCents,
        currency: booking.service.currency,
        status: "not_requested",
        provider: "manual",
      },
    });

    await seedJobChecklistItems(tx, organizationId, created.id, booking.serviceId);

    return created;
  });

  await notifyBookingAccepted(organizationId, bookingRequestId);
  await createJobSeriesFromAcceptedJob(organizationId, job.id);

  captureServerEvent(organizationId, AnalyticsEvents.bookingAccepted, {
    bookingRequestId,
    jobId: job.id,
  });

  return { ok: true as const, jobId: job.id };
}

export async function updateJobStatus(
  organizationId: string,
  jobId: string,
  status: "in_progress" | "completed" | "cancelled" | "confirmed",
) {
  const job = await prisma.job.findFirst({ where: { id: jobId, organizationId } });
  if (!job) return null;

  const updated = await prisma.job.update({
    where: { id: jobId },
    data: {
      status,
      ...(status === "completed" ? { completedAt: new Date() } : {}),
    },
  });

  if (status === "completed" && job.status !== "completed") {
    await notifyJobCompleted(organizationId, jobId);
    captureServerEvent(organizationId, AnalyticsEvents.jobCompleted, { jobId });
  }

  return updated;
}

export async function checkInToJob(organizationId: string, jobId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, organizationId } });
  if (!job) return { ok: false as const, error: "Job not found" };
  if (job.status !== "in_progress") {
    return { ok: false as const, error: "Start the job before checking in" };
  }
  if (job.checkedInAt) return { ok: true as const, alreadyCheckedIn: true as const };

  await prisma.job.update({
    where: { id: jobId },
    data: { checkedInAt: new Date() },
  });

  return { ok: true as const };
}

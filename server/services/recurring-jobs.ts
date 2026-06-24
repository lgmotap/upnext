import { prisma } from "@/lib/db/prisma";
import type { BookingFrequency } from "@/generated/prisma/client";
import { calculateNextOccurrence, isRecurringFrequency } from "@/lib/datetime/recurrence";
import { formatDisplayDateTime, formatTimeHmInTimezone } from "@/lib/datetime/timezone";
import { frequencyLabel } from "@/lib/booking/frequency";
import {
  getJobSeriesByAnchorJob,
  listDueJobSeries,
  updateJobSeriesStatus,
} from "@/server/repositories/job-series";
import { seedJobChecklistItems } from "@/server/services/checklists";
import { assignJobToMember } from "@/server/repositories/assignments";
import { notifyRecurringJobScheduled } from "@/server/services/notifications";

export async function createJobSeriesFromAcceptedJob(organizationId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, organizationId },
    include: {
      bookingRequest: true,
      assignments: { take: 1 },
      organization: { select: { timezone: true } },
    },
  });
  if (!job?.bookingRequest) return null;

  const frequency = job.bookingRequest.frequency;
  if (!isRecurringFrequency(frequency)) return null;

  const existing = await getJobSeriesByAnchorJob(organizationId, jobId);
  if (existing) return existing;

  const timeZone = job.organization.timezone;
  const preferredTimeHm = formatTimeHmInTimezone(job.scheduledStartAt, timeZone);
  const durationMinutes = Math.round(
    (job.scheduledEndAt.getTime() - job.scheduledStartAt.getTime()) / 60_000,
  );
  const nextOccurrenceAt = calculateNextOccurrence(job.scheduledStartAt, frequency, timeZone);

  return prisma.jobSeries.create({
    data: {
      organizationId,
      customerId: job.customerId,
      serviceId: job.serviceId,
      customerAddressId: job.customerAddressId,
      frequency,
      anchorJobId: jobId,
      preferredTimeHm,
      durationMinutes,
      priceCents: job.priceCents,
      currency: job.currency,
      nextOccurrenceAt,
      assignMembershipId: job.assignments[0]?.membershipId ?? null,
      customerNotes: job.customerNotes,
      status: "active",
    },
  });
}

async function generateOccurrenceFromSeries(seriesId: string) {
  const series = await prisma.jobSeries.findUnique({
    where: { id: seriesId },
    include: {
      organization: { select: { timezone: true } },
      customer: { include: { addresses: { where: { isDefault: true }, take: 1 } } },
      service: true,
    },
  });
  if (!series || series.status !== "active") return null;

  const timeZone = series.organization.timezone;
  const startAt = series.nextOccurrenceAt;
  const endAt = new Date(startAt.getTime() + series.durationMinutes * 60_000);
  const address = series.customer.addresses[0] ?? null;

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.bookingRequest.create({
      data: {
        organizationId: series.organizationId,
        customerId: series.customerId,
        serviceId: series.serviceId,
        requestedStartAt: startAt,
        requestedEndAt: endAt,
        status: "accepted",
        frequency: series.frequency,
        customerNotes: series.customerNotes,
        source: "recurring",
      },
    });

    const job = await tx.job.create({
      data: {
        organizationId: series.organizationId,
        bookingRequestId: booking.id,
        customerId: series.customerId,
        customerAddressId: series.customerAddressId ?? address?.id ?? null,
        serviceId: series.serviceId,
        jobSeriesId: series.id,
        title: series.service.name,
        scheduledStartAt: startAt,
        scheduledEndAt: endAt,
        status: "scheduled",
        priceCents: series.priceCents,
        currency: series.currency,
        customerNotes: series.customerNotes,
      },
    });

    await tx.paymentRecord.create({
      data: {
        organizationId: series.organizationId,
        jobId: job.id,
        customerId: series.customerId,
        amountCents: series.priceCents,
        currency: series.currency,
        status: "not_requested",
        provider: "manual",
      },
    });

    await seedJobChecklistItems(tx, series.organizationId, job.id, series.serviceId);

    const nextOccurrenceAt = calculateNextOccurrence(startAt, series.frequency, timeZone);
    await tx.jobSeries.update({
      where: { id: series.id },
      data: { nextOccurrenceAt },
    });

    return { job, booking };
  });

  if (series.assignMembershipId) {
    await assignJobToMember(result.job.id, series.assignMembershipId, series.organizationId);
  }

  await notifyRecurringJobScheduled(series.organizationId, result.job.id, series.frequency);

  return result.job;
}

export async function processDueJobSeries(now = new Date()) {
  const due = await listDueJobSeries(now);
  const generated: string[] = [];
  const errors: string[] = [];

  for (const series of due) {
    try {
      const job = await generateOccurrenceFromSeries(series.id);
      if (job) generated.push(job.id);
    } catch (e) {
      errors.push(`${series.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { processed: due.length, generated: generated.length, jobIds: generated, errors };
}

export async function pauseJobSeries(organizationId: string, seriesId: string) {
  const result = await updateJobSeriesStatus(organizationId, seriesId, "paused");
  return result.count > 0;
}

export async function resumeJobSeries(organizationId: string, seriesId: string) {
  const series = await prisma.jobSeries.findFirst({ where: { id: seriesId, organizationId } });
  if (!series || series.status !== "paused") return false;

  await prisma.jobSeries.update({
    where: { id: seriesId },
    data: { status: "active" },
  });
  return true;
}

export async function cancelJobSeries(organizationId: string, seriesId: string) {
  const result = await updateJobSeriesStatus(organizationId, seriesId, "cancelled");
  return result.count > 0;
}

export function formatSeriesSummary(frequency: BookingFrequency, nextOccurrenceAt: Date, timeZone: string) {
  return {
    frequencyLabel: frequencyLabel(frequency),
    nextLabel: formatDisplayDateTime(nextOccurrenceAt, timeZone),
    frequency,
  };
}

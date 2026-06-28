import { prisma } from "@/lib/db/prisma";
import type { NotificationTemplate } from "@/generated/prisma/client";
import { formatMoney } from "@/lib/money/format";
import { formatRelativeTime } from "@/lib/datetime/relative";
import { templateLabel } from "@/lib/notifications/labels";

export type ActivityFeedType = "booking" | "job" | "payment" | "crew" | "system";

export type ActivityFeedItem = {
  id: string;
  type: ActivityFeedType;
  title: string;
  body: string;
  when: string;
  at: Date;
  href?: string;
};

const CREW_TEMPLATES: NotificationTemplate[] = [
  "job_on_the_way",
  "job_running_late",
  "job_completed",
];

const SOURCE_TAKE = 80;

export async function getOrgActivityFeed(
  organizationId: string,
  _timeZone: string,
  currency: string,
  options: { limit?: number; before?: Date } = {},
): Promise<{ items: ActivityFeedItem[]; hasMore: boolean }> {
  const limit = options.limit ?? 10;
  const now = new Date();
  const crewSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [recentBookings, recentJobs, recentPayments, crewLogs] = await Promise.all([
    prisma.bookingRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: SOURCE_TAKE,
      include: { customer: true, service: true },
    }),
    prisma.job.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: SOURCE_TAKE,
      include: { customer: true, service: true },
    }),
    prisma.paymentRecord.findMany({
      where: { organizationId, status: "paid", paidAt: { not: null } },
      orderBy: { paidAt: "desc" },
      take: SOURCE_TAKE,
      include: { customer: true, job: { select: { id: true, title: true } } },
    }),
    prisma.notificationLog.findMany({
      where: {
        organizationId,
        template: { in: CREW_TEMPLATES },
        sentAt: { gte: crewSince },
      },
      orderBy: { sentAt: "desc" },
      take: SOURCE_TAKE,
    }),
  ]);

  const events: ActivityFeedItem[] = [];

  for (const b of recentBookings) {
    const name = `${b.customer.firstName} ${b.customer.lastName}`.trim();
    const pending = b.status === "pending";
    events.push({
      id: `booking-${b.id}-${b.createdAt.getTime()}`,
      type: pending ? "booking" : "system",
      title: pending ? "Booking request received" : "Booking updated",
      body: pending
        ? `${name} · ${b.service.name}`
        : `${b.status} request from ${name}`,
      when: formatRelativeTime(b.createdAt, now),
      at: b.createdAt,
      href: `/app/bookings/${b.id}`,
    });
  }

  for (const job of recentJobs) {
    const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();
    const at = job.completedAt ?? job.updatedAt;
    const title =
      job.status === "completed"
        ? "Job completed"
        : job.status === "in_progress"
          ? "Job started"
          : "Job updated";
    const body = `${job.service.name} · ${name}`;
    events.push({
      id: `job-${job.id}-${at.getTime()}`,
      type: "job",
      title,
      body,
      when: formatRelativeTime(at, now),
      at,
      href: `/app/jobs/${job.id}`,
    });
  }

  for (const payment of recentPayments) {
    if (!payment.paidAt) continue;
    const name = `${payment.customer.firstName} ${payment.customer.lastName}`.trim();
    events.push({
      id: `payment-${payment.id}-${payment.paidAt.getTime()}`,
      type: "payment",
      title: "Payment received",
      body: `${formatMoney(payment.amountCents, currency)} from ${name}`,
      when: formatRelativeTime(payment.paidAt, now),
      at: payment.paidAt,
      href: payment.job?.id ? `/app/jobs/${payment.job.id}` : "/app/payments",
    });
  }

  const crewJobIds = crewLogs.map((l) => l.relatedId).filter(Boolean) as string[];
  const crewJobs =
    crewJobIds.length > 0
      ? await prisma.job.findMany({
          where: { organizationId, id: { in: crewJobIds } },
          include: { customer: true },
        })
      : [];
  const jobCustomerById = new Map(crewJobs.map((j) => [j.id, j]));
  const crewDedupeKeys = new Set<string>();

  for (const log of crewLogs) {
    if (!log.relatedId) continue;
    const bucket = Math.floor(log.sentAt.getTime() / (5 * 60_000));
    const dedupeKey = `${log.relatedId}:${log.template}:${bucket}`;
    if (crewDedupeKeys.has(dedupeKey)) continue;
    crewDedupeKeys.add(dedupeKey);

    const job = jobCustomerById.get(log.relatedId);
    const customerName = job
      ? `${job.customer.firstName} ${job.customer.lastName}`.trim()
      : "customer";
    events.push({
      id: `crew-${log.id}`,
      type: "crew",
      title: templateLabel(log.template),
      body: customerName,
      when: formatRelativeTime(log.sentAt, now),
      at: log.sentAt,
      href: `/app/jobs/${log.relatedId}`,
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());

  const filtered = options.before
    ? events.filter((e) => e.at.getTime() < options.before!.getTime())
    : events;

  const slice = filtered.slice(0, limit + 1);
  const hasMore = slice.length > limit;
  const items = slice.slice(0, limit);

  return { items, hasMore };
}

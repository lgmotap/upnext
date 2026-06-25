import { prisma } from "@/lib/db/prisma";
import type { NotificationTemplate } from "@/generated/prisma/client";
import { formatMoney } from "@/lib/money/format";
import { getWeekRange, getDayBoundsUtc, formatAddressLine } from "@/lib/datetime/calendar";
import { formatRelativeTime } from "@/lib/datetime/relative";
import { formatGreetingSubtitle, formatGreetingTitle, getGreetingPeriod } from "@/lib/datetime/greeting";
import { templateLabel } from "@/lib/notifications/labels";
import { frequencyLabel } from "@/lib/booking/frequency";
import { getThirtyDaySnapshot, type ThirtyDaySnapshot } from "@/lib/reporting/period-stats";
import {
  addDaysYmd,
  formatDisplayDateTime,
  formatTimeHmInTimezone,
  formatYmdInTimezone,
  localDateTimeToUtc,
} from "@/lib/datetime/timezone";

export type DashboardQueueStat = {
  id: "booked_today" | "scheduled_today" | "awaiting_payment" | "unassigned_today";
  label: string;
  value: string;
  delta?: string;
  href: string;
  iconClassName: string;
};

export type DashboardJobRow = {
  id: string;
  customerName: string;
  customerInitials: string;
  serviceName: string;
  startTime: string;
  assigneeName: string | null;
  assigneeInitials: string | null;
  status: string;
  addressLine: string | null;
  priceLabel: string;
  frequencyLabel: string | null;
};

export type DashboardBookingRow = {
  id: string;
  customerName: string;
  serviceName: string;
  requestedLabel: string;
};

export type DashboardActivityRow = {
  who: string;
  what: string;
  when: string;
  at: Date;
};

export type DashboardData = {
  greetingName: string;
  greetingTitle: string;
  greetingSubtitle: string;
  dateLabel: string;
  showBusinessSnapshot: boolean;
  snapshot: ThirtyDaySnapshot | null;
  queueStats: DashboardQueueStat[];
  todayJobs: DashboardJobRow[];
  pendingBookings: DashboardBookingRow[];
  pendingCount: number;
  weekRevenueBars: number[];
  weekRevenueTotalLabel: string;
  activity: DashboardActivityRow[];
};

const CREW_TEMPLATES: NotificationTemplate[] = [
  "job_on_the_way",
  "job_running_late",
  "job_completed",
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export async function getDashboardData(
  organizationId: string,
  timeZone: string,
  currency: string,
  userName: string | null,
  displayName: string,
  gettingStartedPercent: number,
): Promise<DashboardData> {
  const now = new Date();
  const todayYmd = formatYmdInTimezone(now, timeZone);
  const { start: todayStart, end: todayEnd } = getDayBoundsUtc(todayYmd, timeZone);
  const { rangeStart, rangeEnd, days: weekDays } = getWeekRange(timeZone, now);
  const crewSince = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    todayJobsRaw,
    pendingBookingsRaw,
    paidThisWeek,
    paymentAgg,
    recentBookings,
    recentJobs,
    recentPayments,
    bookedTodayCount,
    unassignedTodayCount,
    crewLogs,
    snapshot,
  ] = await Promise.all([
    prisma.job.findMany({
      where: {
        organizationId,
        scheduledStartAt: { gte: todayStart, lt: todayEnd },
        status: { notIn: ["cancelled"] },
      },
      orderBy: { scheduledStartAt: "asc" },
      include: {
        customer: true,
        service: true,
        customerAddress: true,
        bookingRequest: { select: { frequency: true } },
        jobSeries: { select: { frequency: true } },
        assignments: { include: { membership: { include: { user: true } } }, take: 1 },
      },
    }),
    prisma.bookingRequest.findMany({
      where: { organizationId, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true, service: true },
    }),
    prisma.paymentRecord.findMany({
      where: {
        organizationId,
        status: "paid",
        paidAt: { gte: rangeStart, lt: rangeEnd },
      },
      select: { amountCents: true, paidAt: true },
    }),
    prisma.paymentRecord.groupBy({
      by: ["status"],
      where: { organizationId, status: { in: ["pending", "overdue"] } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.bookingRequest.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: true, service: true },
    }),
    prisma.job.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 8,
      include: { customer: true, service: true },
    }),
    prisma.paymentRecord.findMany({
      where: { organizationId, status: "paid", paidAt: { not: null } },
      orderBy: { paidAt: "desc" },
      take: 8,
      include: { customer: true, job: { select: { title: true } } },
    }),
    prisma.bookingRequest.count({
      where: {
        organizationId,
        status: "accepted",
        updatedAt: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.job.count({
      where: {
        organizationId,
        scheduledStartAt: { gte: todayStart, lt: todayEnd },
        status: { notIn: ["cancelled"] },
        assignments: { none: {} },
      },
    }),
    prisma.notificationLog.findMany({
      where: {
        organizationId,
        template: { in: CREW_TEMPLATES },
        sentAt: { gte: crewSince },
      },
      orderBy: { sentAt: "desc" },
      take: 15,
    }),
    gettingStartedPercent >= 100 ? getThirtyDaySnapshot(organizationId, timeZone, now) : null,
  ]);

  const pendingCount = await prisma.bookingRequest.count({
    where: { organizationId, status: "pending" },
  });

  const weekRevenueCents = paidThisWeek.reduce((sum, p) => sum + p.amountCents, 0);

  let outstandingCents = 0;
  let outstandingCount = 0;
  for (const row of paymentAgg) {
    outstandingCents += row._sum.amountCents ?? 0;
    outstandingCount += row._count;
  }

  const queueStats: DashboardQueueStat[] = [
    {
      id: "booked_today",
      label: "Booked today",
      value: String(bookedTodayCount),
      delta: bookedTodayCount === 1 ? "1 accepted today" : `${bookedTodayCount} accepted today`,
      href: "/app/bookings?status=accepted&range=today",
      iconClassName: "bg-emerald-100 text-emerald-700",
    },
    {
      id: "scheduled_today",
      label: "Scheduled today",
      value: String(todayJobsRaw.length),
      delta: todayJobsRaw.length === 1 ? "1 job" : `${todayJobsRaw.length} jobs`,
      href: "/app/jobs?date=today",
      iconClassName: "bg-sky-100 text-sky-700",
    },
    {
      id: "awaiting_payment",
      label: "Awaiting payment",
      value: String(outstandingCount),
      delta: formatMoney(outstandingCents, currency) + " pending",
      href: "/app/payments?status=pending",
      iconClassName: "bg-amber-100 text-amber-800",
    },
    {
      id: "unassigned_today",
      label: "Needs assignment",
      value: String(unassignedTodayCount),
      delta: unassignedTodayCount > 0 ? "Unassigned today" : "All assigned",
      href: "/app/jobs?date=today&unassigned=1",
      iconClassName: "bg-rose-100 text-rose-700",
    },
  ];

  const todayJobs: DashboardJobRow[] = todayJobsRaw.map((job) => {
    const customerName = `${job.customer.firstName} ${job.customer.lastName}`.trim();
    const assignee = job.assignments[0]?.membership.user;
    const assigneeName = assignee?.name ?? assignee?.email ?? null;
    const freq =
      job.jobSeries?.frequency ?? job.bookingRequest?.frequency ?? null;
    return {
      id: job.id,
      customerName,
      customerInitials: initials(customerName),
      serviceName: job.service.name,
      startTime: formatTimeHmInTimezone(job.scheduledStartAt, timeZone),
      assigneeName,
      assigneeInitials: assigneeName ? initials(assigneeName) : null,
      status: job.status,
      addressLine: job.customerAddress ? formatAddressLine(job.customerAddress) : null,
      priceLabel: formatMoney(job.priceCents, job.currency ?? currency),
      frequencyLabel: freq ? frequencyLabel(freq) : null,
    };
  });

  const pendingBookings: DashboardBookingRow[] = pendingBookingsRaw.map((b) => ({
    id: b.id,
    customerName: `${b.customer.firstName} ${b.customer.lastName}`.trim(),
    serviceName: b.service.name,
    requestedLabel: formatDisplayDateTime(b.requestedStartAt, timeZone),
  }));

  const revenueByDay = weekDays.map((day) => {
    const dayEnd = localDateTimeToUtc(addDaysYmd(day.date, 1), "00:00", timeZone);
    const cents = paidThisWeek
      .filter((p) => p.paidAt && p.paidAt >= day.startAt && p.paidAt < dayEnd)
      .reduce((sum, p) => sum + p.amountCents, 0);
    return cents;
  });
  const maxRevenue = Math.max(...revenueByDay, 1);
  const weekRevenueBars = revenueByDay.map((cents) => Math.round((cents / maxRevenue) * 100));

  const activityEvents: DashboardActivityRow[] = [];

  for (const b of recentBookings) {
    const name = `${b.customer.firstName} ${b.customer.lastName}`.trim();
    activityEvents.push({
      who: "System",
      what:
        b.status === "pending"
          ? `received a booking request from ${name}`
          : `${b.status} booking request from ${name}`,
      when: formatRelativeTime(b.createdAt, now),
      at: b.createdAt,
    });
  }

  for (const job of recentJobs) {
    const name = `${job.customer.firstName} ${job.customer.lastName}`.trim();
    const when = job.completedAt ?? job.updatedAt;
    const verb =
      job.status === "completed"
        ? `completed ${name} — ${job.service.name}`
        : job.status === "in_progress"
          ? `started ${name} — ${job.service.name}`
          : `updated ${name} — ${job.service.name}`;
    activityEvents.push({
      who: "Team",
      what: verb,
      when: formatRelativeTime(when, now),
      at: when,
    });
  }

  for (const payment of recentPayments) {
    if (!payment.paidAt) continue;
    const name = `${payment.customer.firstName} ${payment.customer.lastName}`.trim();
    activityEvents.push({
      who: name,
      what: `paid ${formatMoney(payment.amountCents, currency)} for ${payment.job?.title ?? "a job"}`,
      when: formatRelativeTime(payment.paidAt, now),
      at: payment.paidAt,
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
    activityEvents.push({
      who: "Team",
      what: `${templateLabel(log.template)} — ${customerName}`,
      when: formatRelativeTime(log.sentAt, now),
      at: log.sentAt,
    });
  }

  activityEvents.sort((a, b) => b.at.getTime() - a.at.getTime());
  const activity = activityEvents.slice(0, 10);

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  const firstName = (userName ?? "there").split(" ")[0]!;
  const greetingPeriod = getGreetingPeriod(now, timeZone);

  return {
    greetingName: firstName,
    greetingTitle: formatGreetingTitle(greetingPeriod, displayName),
    greetingSubtitle: formatGreetingSubtitle(firstName, dateLabel),
    dateLabel,
    showBusinessSnapshot: gettingStartedPercent >= 100,
    snapshot,
    queueStats,
    todayJobs,
    pendingBookings,
    pendingCount,
    weekRevenueBars,
    weekRevenueTotalLabel: formatMoney(weekRevenueCents, currency),
    activity,
  };
}

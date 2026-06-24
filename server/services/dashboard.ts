import { prisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/money/format";
import { getWeekRange } from "@/lib/datetime/calendar";
import {
  addDaysYmd,
  formatDisplayDateTime,
  formatTimeHmInTimezone,
  formatYmdInTimezone,
  localDateTimeToUtc,
} from "@/lib/datetime/timezone";
import { formatRelativeTime } from "@/lib/datetime/relative";

export type DashboardStat = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
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
  dateLabel: string;
  stats: DashboardStat[];
  todayJobs: DashboardJobRow[];
  pendingBookings: DashboardBookingRow[];
  pendingCount: number;
  weekRevenueBars: number[];
  weekRevenueTotalLabel: string;
  activity: DashboardActivityRow[];
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getDayBoundsUtc(todayYmd: string, timeZone: string) {
  const start = localDateTimeToUtc(todayYmd, "00:00", timeZone);
  const end = localDateTimeToUtc(addDaysYmd(todayYmd, 1), "00:00", timeZone);
  return { start, end };
}

export async function getDashboardData(
  organizationId: string,
  timeZone: string,
  currency: string,
  userName: string | null,
): Promise<DashboardData> {
  const now = new Date();
  const todayYmd = formatYmdInTimezone(now, timeZone);
  const { start: todayStart, end: todayEnd } = getDayBoundsUtc(todayYmd, timeZone);
  const { rangeStart, rangeEnd, days: weekDays } = getWeekRange(timeZone, now);

  const [
    todayJobsRaw,
    pendingBookingsRaw,
    bookingsThisWeekCount,
    paidThisWeek,
    paymentAgg,
    recentBookings,
    recentJobs,
    recentPayments,
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
        assignments: { include: { membership: { include: { user: true } } }, take: 1 },
      },
    }),
    prisma.bookingRequest.findMany({
      where: { organizationId, status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true, service: true },
    }),
    prisma.bookingRequest.count({
      where: {
        organizationId,
        createdAt: { gte: rangeStart, lt: rangeEnd },
      },
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
  ]);

  const pendingCount = await prisma.bookingRequest.count({
    where: { organizationId, status: "pending" },
  });

  const completedToday = todayJobsRaw.filter((j) => j.status === "completed").length;
  const weekRevenueCents = paidThisWeek.reduce((sum, p) => sum + p.amountCents, 0);

  let outstandingCents = 0;
  let outstandingCount = 0;
  for (const row of paymentAgg) {
    outstandingCents += row._sum.amountCents ?? 0;
    outstandingCount += row._count;
  }

  const stats: DashboardStat[] = [
    {
      label: "Jobs today",
      value: String(todayJobsRaw.length),
      delta: completedToday > 0 ? `${completedToday} completed` : undefined,
      trend: "up",
    },
    {
      label: "Pending requests",
      value: String(pendingCount),
      delta: pendingCount > 0 ? `${pendingCount} awaiting` : undefined,
      trend: pendingCount > 0 ? "up" : "down",
    },
    {
      label: "Revenue this week",
      value: formatMoney(weekRevenueCents, currency),
      delta: `${bookingsThisWeekCount} new booking${bookingsThisWeekCount === 1 ? "" : "s"}`,
      trend: "up",
    },
    {
      label: "Outstanding",
      value: formatMoney(outstandingCents, currency),
      delta: outstandingCount > 0 ? `${outstandingCount} to chase` : undefined,
      trend: outstandingCount > 0 ? "down" : "up",
    },
  ];

  const todayJobs: DashboardJobRow[] = todayJobsRaw.map((job) => {
    const customerName = `${job.customer.firstName} ${job.customer.lastName}`.trim();
    const assignee = job.assignments[0]?.membership.user;
    const assigneeName = assignee?.name ?? assignee?.email ?? null;
    return {
      id: job.id,
      customerName,
      customerInitials: initials(customerName),
      serviceName: job.service.name,
      startTime: formatTimeHmInTimezone(job.scheduledStartAt, timeZone),
      assigneeName,
      assigneeInitials: assigneeName ? initials(assigneeName) : null,
      status: job.status,
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

  activityEvents.sort((a, b) => b.at.getTime() - a.at.getTime());
  const activity = activityEvents.slice(0, 10);

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  const firstName = (userName ?? "there").split(" ")[0];

  return {
    greetingName: firstName,
    dateLabel,
    stats,
    todayJobs,
    pendingBookings,
    pendingCount,
    weekRevenueBars,
    weekRevenueTotalLabel: formatMoney(weekRevenueCents, currency),
    activity,
  };
}

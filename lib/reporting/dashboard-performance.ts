import { prisma } from "@/lib/db/prisma";
import {
  addDaysYmd,
  localDateTimeToUtc,
} from "@/lib/datetime/timezone";
import type {
  DashboardPerformanceData,
  DashboardPerformanceRange,
} from "@/lib/reporting/dashboard-performance.types";

export type { DashboardPerformanceData, DashboardPerformanceRange } from "@/lib/reporting/dashboard-performance.types";
export {
  dashboardRangePresets,
  defaultDashboardPerformanceRange,
  parseDashboardPerformanceRange,
} from "@/lib/reporting/dashboard-performance.shared";

function dayKeysInclusive(fromYmd: string, toYmd: string): string[] {
  const out: string[] = [];
  let cursor = fromYmd;
  while (cursor <= toYmd) {
    out.push(cursor);
    cursor = addDaysYmd(cursor, 1);
  }
  return out;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current > 0 ? 100 : null;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function countNewCustomers(organizationId: string, start: Date, end: Date): Promise<number> {
  const inRange = await prisma.bookingRequest.findMany({
    where: { organizationId, createdAt: { gte: start, lt: end } },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  if (inRange.length === 0) return 0;

  const customerIds = inRange.map((r) => r.customerId);
  const returning = await prisma.bookingRequest.findMany({
    where: {
      organizationId,
      customerId: { in: customerIds },
      createdAt: { lt: start },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const returningSet = new Set(returning.map((r) => r.customerId));
  return customerIds.filter((id) => !returningSet.has(id)).length;
}

async function countJobsScheduled(organizationId: string, start: Date, end: Date): Promise<number> {
  return prisma.job.count({
    where: {
      organizationId,
      scheduledStartAt: { gte: start, lt: end },
      status: { notIn: ["cancelled"] },
    },
  });
}

async function countJobsCompleted(organizationId: string, start: Date, end: Date): Promise<number> {
  return prisma.job.count({
    where: {
      organizationId,
      status: "completed",
      completedAt: { gte: start, lt: end },
    },
  });
}

async function averageCompletedJobValueCents(
  organizationId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const agg = await prisma.job.aggregate({
    where: {
      organizationId,
      status: "completed",
      completedAt: { gte: start, lt: end },
    },
    _avg: { priceCents: true },
    _count: true,
  });
  if (!agg._count) return 0;
  return Math.round(agg._avg.priceCents ?? 0);
}

async function repeatCustomersPct(organizationId: string, start: Date, end: Date): Promise<number> {
  const completedInRange = await prisma.job.findMany({
    where: {
      organizationId,
      status: "completed",
      completedAt: { gte: start, lt: end },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  if (completedInRange.length === 0) return 0;

  const customerIds = completedInRange.map((j) => j.customerId);
  const priorCompleted = await prisma.job.findMany({
    where: {
      organizationId,
      customerId: { in: customerIds },
      status: "completed",
      completedAt: { lt: start, not: null },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const repeatSet = new Set(priorCompleted.map((r) => r.customerId));
  const repeatCount = customerIds.filter((id) => repeatSet.has(id)).length;
  return Math.round((repeatCount / customerIds.length) * 1000) / 10;
}

async function countCanceledRescheduled(organizationId: string, start: Date, end: Date): Promise<number> {
  const [cancelledBookings, cancelledJobs, rescheduledLogs] = await Promise.all([
    prisma.bookingRequest.count({
      where: {
        organizationId,
        status: "cancelled",
        updatedAt: { gte: start, lt: end },
      },
    }),
    prisma.job.count({
      where: {
        organizationId,
        status: "cancelled",
        updatedAt: { gte: start, lt: end },
      },
    }),
    prisma.notificationLog.count({
      where: {
        organizationId,
        template: { in: ["booking_rescheduled", "job_rescheduled"] },
        sentAt: { gte: start, lt: end },
      },
    }),
  ]);
  return cancelledBookings + cancelledJobs + rescheduledLogs;
}

async function sumCompletedJobRevenueCents(
  organizationId: string,
  start: Date,
  end: Date,
): Promise<number> {
  const agg = await prisma.job.aggregate({
    where: {
      organizationId,
      status: "completed",
      completedAt: { gte: start, lt: end },
    },
    _sum: { priceCents: true },
  });
  return agg._sum.priceCents ?? 0;
}

async function dailyNewCustomersSeries(
  organizationId: string,
  range: Pick<DashboardPerformanceRange, "fromYmd" | "toYmd" | "start" | "end">,
  timeZone: string,
): Promise<number[]> {
  const keys = dayKeysInclusive(range.fromYmd, range.toYmd);

  const inRange = await prisma.bookingRequest.findMany({
    where: { organizationId, createdAt: { gte: range.start, lt: range.end } },
    select: { customerId: true, createdAt: true },
  });

  if (inRange.length === 0) return keys.map(() => 0);

  const customerIds = [...new Set(inRange.map((b) => b.customerId))];
  const returning = await prisma.bookingRequest.findMany({
    where: {
      organizationId,
      customerId: { in: customerIds },
      createdAt: { lt: range.start },
    },
    select: { customerId: true },
    distinct: ["customerId"],
  });
  const returningSet = new Set(returning.map((r) => r.customerId));

  const firstInRange = new Map<string, Date>();
  for (const booking of inRange) {
    if (returningSet.has(booking.customerId)) continue;
    const existing = firstInRange.get(booking.customerId);
    if (!existing || booking.createdAt < existing) {
      firstInRange.set(booking.customerId, booking.createdAt);
    }
  }

  return keys.map((ymd) => {
    const dayStart = localDateTimeToUtc(ymd, "00:00", timeZone);
    const dayEnd = localDateTimeToUtc(addDaysYmd(ymd, 1), "00:00", timeZone);
    let count = 0;
    for (const firstAt of firstInRange.values()) {
      if (firstAt >= dayStart && firstAt < dayEnd) count++;
    }
    return count;
  });
}

async function jobsDailySeries(
  organizationId: string,
  range: Pick<DashboardPerformanceRange, "fromYmd" | "toYmd" | "start" | "end">,
  timeZone: string,
): Promise<{ dailyJobsScheduled: number[] }> {
  const keys = dayKeysInclusive(range.fromYmd, range.toYmd);

  const scheduledJobs = await prisma.job.findMany({
    where: {
      organizationId,
      scheduledStartAt: { gte: range.start, lt: range.end },
      status: { notIn: ["cancelled"] },
    },
    select: { scheduledStartAt: true },
  });

  const dailyJobsScheduled = keys.map((ymd) => {
    const dayStart = localDateTimeToUtc(ymd, "00:00", timeZone);
    const dayEnd = localDateTimeToUtc(addDaysYmd(ymd, 1), "00:00", timeZone);
    return scheduledJobs.filter(
      (j) => j.scheduledStartAt >= dayStart && j.scheduledStartAt < dayEnd,
    ).length;
  });

  return { dailyJobsScheduled };
}

async function revenueDailySeries(
  organizationId: string,
  range: Pick<DashboardPerformanceRange, "fromYmd" | "toYmd" | "start" | "end">,
  timeZone: string,
): Promise<{ dailyCents: number[]; dailyLabels: string[] }> {
  const keys = dayKeysInclusive(range.fromYmd, range.toYmd);
  const jobs = await prisma.job.findMany({
    where: {
      organizationId,
      status: "completed",
      completedAt: { gte: range.start, lt: range.end, not: null },
    },
    select: { priceCents: true, completedAt: true },
  });

  const fmt =
    keys.length > 14
      ? new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" })
      : new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" });

  const dailyCents = keys.map((ymd) => {
    const dayStart = localDateTimeToUtc(ymd, "00:00", timeZone);
    const dayEnd = localDateTimeToUtc(addDaysYmd(ymd, 1), "00:00", timeZone);
    return jobs
      .filter((j) => j.completedAt && j.completedAt >= dayStart && j.completedAt < dayEnd)
      .reduce((sum, j) => sum + j.priceCents, 0);
  });

  const dailyLabels = keys.map((ymd) => {
    const d = localDateTimeToUtc(ymd, "12:00", timeZone);
    return fmt.format(d);
  });

  return { dailyCents, dailyLabels };
}

async function snapshotForBounds(
  organizationId: string,
  bounds: { start: Date; end: Date },
): Promise<{
  newCustomers: number;
  jobsScheduled: number;
  jobsCompleted: number;
  averageJobValueCents: number;
  repeatCustomersPct: number;
  canceledRescheduled: number;
  revenueCents: number;
}> {
  const { start, end } = bounds;
  const [newCustomers, jobsScheduled, jobsCompleted, averageJobValueCents, repeatPct, canceledRescheduled, revenueCents] =
    await Promise.all([
      countNewCustomers(organizationId, start, end),
      countJobsScheduled(organizationId, start, end),
      countJobsCompleted(organizationId, start, end),
      averageCompletedJobValueCents(organizationId, start, end),
      repeatCustomersPct(organizationId, start, end),
      countCanceledRescheduled(organizationId, start, end),
      sumCompletedJobRevenueCents(organizationId, start, end),
    ]);

  return {
    newCustomers,
    jobsScheduled,
    jobsCompleted,
    averageJobValueCents,
    repeatCustomersPct: repeatPct,
    canceledRescheduled,
    revenueCents,
  };
}

export async function getDashboardPerformance(
  organizationId: string,
  timeZone: string,
  range: DashboardPerformanceRange,
): Promise<DashboardPerformanceData> {
  const [current, prior, revenueSeries, jobsSeries, dailyNewCustomers] = await Promise.all([
    snapshotForBounds(organizationId, range),
    snapshotForBounds(organizationId, {
      start: range.priorStart,
      end: range.priorEnd,
    }),
    revenueDailySeries(organizationId, range, timeZone),
    jobsDailySeries(organizationId, range, timeZone),
    dailyNewCustomersSeries(organizationId, range, timeZone),
  ]);

  return {
    range,
    bookings: {
      newCustomers: current.newCustomers,
      newCustomersChangePct: pctChange(current.newCustomers, prior.newCustomers),
      jobsScheduled: current.jobsScheduled,
      jobsScheduledChangePct: pctChange(current.jobsScheduled, prior.jobsScheduled),
      dailyJobsScheduled: jobsSeries.dailyJobsScheduled,
      dailyNewCustomers,
    },
    metrics: {
      jobsCompleted: current.jobsCompleted,
      jobsCompletedChangePct: pctChange(current.jobsCompleted, prior.jobsCompleted),
      averageJobValueCents: current.averageJobValueCents,
      averageJobValueChangePct: pctChange(current.averageJobValueCents, prior.averageJobValueCents),
      repeatCustomersPct: current.repeatCustomersPct,
      repeatCustomersChangePct: pctChange(current.repeatCustomersPct, prior.repeatCustomersPct),
      canceledRescheduled: current.canceledRescheduled,
      canceledRescheduledChangePct: pctChange(current.canceledRescheduled, prior.canceledRescheduled),
    },
    revenue: {
      totalCents: current.revenueCents,
      changePct: pctChange(current.revenueCents, prior.revenueCents),
      dailyCents: revenueSeries.dailyCents,
      dailyLabels: revenueSeries.dailyLabels,
    },
  };
}

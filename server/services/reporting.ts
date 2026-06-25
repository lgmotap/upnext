import { prisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/money/format";
import { getWeekRange } from "@/lib/datetime/calendar";
import {
  addDaysYmd,
  formatDisplayDateTime,
  formatYmdInTimezone,
  localDateTimeToUtc,
} from "@/lib/datetime/timezone";
import { paymentAggregatesForOrg } from "@/server/repositories/payments";
import { sumPaidInRange, getThirtyDaySnapshot, last30DayBounds } from "@/lib/reporting/period-stats";

export { getThirtyDaySnapshot, last30DayBounds } from "@/lib/reporting/period-stats";

export type ReportingPeriodStats = {
  label: string;
  revenueCents: number;
  jobsCompleted: number;
  newBookings: number;
};

export type ReportingRangeStats = ReportingPeriodStats & {
  fromYmd: string;
  toYmd: string;
  exportRowCount: number;
};

export type ReportingExportRow = {
  date: string;
  customer: string;
  service: string;
  jobStatus: string;
  amount: string;
  paymentStatus: string;
};

export type ReportingData = {
  currency: string;
  timeZone: string;
  allTimeRevenueCents: number;
  outstandingCents: number;
  overdueCents: number;
  thisWeek: ReportingPeriodStats;
  thisMonth: ReportingPeriodStats;
  weeklyTrend: { weekLabel: string; revenueCents: number }[];
};

function monthBoundsUtc(ymd: string, timeZone: string) {
  const [y, m] = ymd.split("-").map(Number);
  const startYmd = `${y}-${String(m).padStart(2, "0")}-01`;
  const nextMonth = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  return {
    start: localDateTimeToUtc(startYmd, "00:00", timeZone),
    end: localDateTimeToUtc(nextMonth, "00:00", timeZone),
  };
}

async function countJobsCompletedInRange(organizationId: string, start: Date, end: Date) {
  return prisma.job.count({
    where: {
      organizationId,
      status: "completed",
      completedAt: { gte: start, lt: end },
    },
  });
}

async function countBookingsInRange(organizationId: string, start: Date, end: Date) {
  return prisma.bookingRequest.count({
    where: {
      organizationId,
      createdAt: { gte: start, lt: end },
    },
  });
}

export async function getReportingData(organizationId: string, timeZone: string, currency: string): Promise<ReportingData> {
  const now = new Date();
  const todayYmd = formatYmdInTimezone(now, timeZone);
  const { rangeStart: weekStart, rangeEnd: weekEnd, weekLabel } = getWeekRange(timeZone, now);
  const month = monthBoundsUtc(todayYmd, timeZone);

  const [allTimePaid, aggregates, weekRevenue, weekJobs, weekBookings, monthRevenue, monthJobs, monthBookings] =
    await Promise.all([
      prisma.paymentRecord.aggregate({
        where: { organizationId, status: "paid" },
        _sum: { amountCents: true },
      }),
      paymentAggregatesForOrg(organizationId),
      sumPaidInRange(organizationId, weekStart, weekEnd),
      countJobsCompletedInRange(organizationId, weekStart, weekEnd),
      countBookingsInRange(organizationId, weekStart, weekEnd),
      sumPaidInRange(organizationId, month.start, month.end),
      countJobsCompletedInRange(organizationId, month.start, month.end),
      countBookingsInRange(organizationId, month.start, month.end),
    ]);

  const weeklyTrend: ReportingData["weeklyTrend"] = [];
  for (let i = 3; i >= 0; i--) {
    const anchorYmd = addDaysYmd(todayYmd, -7 * i);
    const anchor = localDateTimeToUtc(anchorYmd, "12:00", timeZone);
    const { rangeStart, rangeEnd, weekLabel: label } = getWeekRange(timeZone, anchor);
    const revenueCents = await sumPaidInRange(organizationId, rangeStart, rangeEnd);
    weeklyTrend.push({ weekLabel: label, revenueCents });
  }

  const monthLabel = new Intl.DateTimeFormat("en-US", { timeZone, month: "long", year: "numeric" }).format(now);

  return {
    currency,
    timeZone,
    allTimeRevenueCents: allTimePaid._sum.amountCents ?? 0,
    outstandingCents: aggregates.outstandingCents,
    overdueCents: aggregates.overdueCents,
    thisWeek: {
      label: weekLabel,
      revenueCents: weekRevenue,
      jobsCompleted: weekJobs,
      newBookings: weekBookings,
    },
    thisMonth: {
      label: monthLabel,
      revenueCents: monthRevenue,
      jobsCompleted: monthJobs,
      newBookings: monthBookings,
    },
    weeklyTrend,
  };
}

export function formatReportingMoney(cents: number, currency: string) {
  return formatMoney(cents, currency);
}

export async function getReportingRangeStats(
  organizationId: string,
  timeZone: string,
  currency: string,
  start: Date,
  end: Date,
  label: string,
  fromYmd: string,
  toYmd: string,
): Promise<ReportingRangeStats> {
  const [revenueCents, jobsCompleted, newBookings, exportRowCount] = await Promise.all([
    sumPaidInRange(organizationId, start, end),
    countJobsCompletedInRange(organizationId, start, end),
    countBookingsInRange(organizationId, start, end),
    prisma.job.count({
      where: {
        organizationId,
        scheduledStartAt: { gte: start, lt: end },
        status: { not: "cancelled" },
      },
    }),
  ]);

  return {
    label,
    fromYmd,
    toYmd,
    revenueCents,
    jobsCompleted,
    newBookings,
    exportRowCount,
  };
}

export async function getReportingExportRows(
  organizationId: string,
  start: Date,
  end: Date,
  timeZone: string,
  currency: string,
): Promise<ReportingExportRow[]> {
  const jobs = await prisma.job.findMany({
    where: {
      organizationId,
      scheduledStartAt: { gte: start, lt: end },
      status: { not: "cancelled" },
    },
    orderBy: { scheduledStartAt: "asc" },
    include: {
      customer: true,
      service: true,
      paymentRecord: true,
    },
  });

  return jobs.map((job) => {
    const customerName = `${job.customer.firstName} ${job.customer.lastName}`.trim();
    const payment = job.paymentRecord;
    const amountCents = payment?.amountCents ?? job.priceCents;
    const payCurrency = payment?.currency ?? job.currency ?? currency;

    return {
      date: formatDisplayDateTime(job.scheduledStartAt, timeZone),
      customer: customerName,
      service: job.service.name,
      jobStatus: job.status.replaceAll("_", " "),
      amount: formatMoney(amountCents, payCurrency),
      paymentStatus: payment?.status?.replaceAll("_", " ") ?? "not requested",
    };
  });
}

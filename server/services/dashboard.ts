import { prisma } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/money/format";
import { getDayBoundsUtc, formatAddressLine } from "@/lib/datetime/calendar";
import { frequencyLabel } from "@/lib/booking/frequency";
import {
  addDaysYmd,
  formatTimeHmInTimezone,
  formatYmdInTimezone,
} from "@/lib/datetime/timezone";
import { getOrgActivityFeed, type ActivityFeedItem } from "@/server/services/activity-feed";

export type { ActivityFeedItem };

export type DashboardQueueStat = {
  id: "jobs_today" | "new_bookings" | "unassigned_today" | "awaiting_payment";
  label: string;
  value: string;
  subtext: string;
  href: string;
  sparkline7d: number[];
  sparklineColor: string;
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

export type DashboardActivityRow = ActivityFeedItem;

export type DashboardData = {
  pageTitle: string;
  pageSubtitle: string;
  greetingName: string;
  dateLabel: string;
  showPerformance: boolean;
  queueStats: DashboardQueueStat[];
  upcomingJobs: DashboardJobRow[];
  activity: ActivityFeedItem[];
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

type DayBucket = { start: Date; end: Date };

function last7DayBuckets(timeZone: string, now: Date): DayBucket[] {
  const todayYmd = formatYmdInTimezone(now, timeZone);
  const buckets: DayBucket[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const ymd = addDaysYmd(todayYmd, offset);
    buckets.push(getDayBoundsUtc(ymd, timeZone));
  }
  return buckets;
}

function countInBuckets<T>(items: T[], getDate: (item: T) => Date, buckets: DayBucket[]): number[] {
  return buckets.map(({ start, end }) =>
    items.filter((item) => {
      const d = getDate(item);
      return d >= start && d < end;
    }).length,
  );
}

function pendingPaymentsOnDay(
  payments: { createdAt: Date; paidAt: Date | null }[],
  dayEnd: Date,
): number {
  return payments.filter((p) => p.createdAt < dayEnd && (p.paidAt === null || p.paidAt >= dayEnd)).length;
}

export async function getDashboardData(
  organizationId: string,
  timeZone: string,
  currency: string,
  userName: string | null,
  _displayName: string,
  gettingStartedPercent: number,
): Promise<DashboardData> {
  const now = new Date();
  const todayYmd = formatYmdInTimezone(now, timeZone);
  const { start: todayStart, end: todayEnd } = getDayBoundsUtc(todayYmd, timeZone);
  const sparkFromYmd = addDaysYmd(todayYmd, -6);
  const { start: sparkStart } = getDayBoundsUtc(sparkFromYmd, timeZone);
  const dayBuckets = last7DayBuckets(timeZone, now);

  const [
    todayJobsRaw,
    upcomingJobsRaw,
    paymentAgg,
    completedTodayCount,
    newBookingsTodayCount,
    needsAssignmentCount,
    sparkJobsRaw,
    sparkBookingsRaw,
    sparkPaymentsRaw,
    sparkUnassignedJobsRaw,
    activityFeed,
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
    prisma.job.findMany({
      where: {
        organizationId,
        scheduledStartAt: { gte: todayStart },
        status: { notIn: ["cancelled"] },
      },
      orderBy: { scheduledStartAt: "asc" },
      take: 10,
      include: {
        customer: true,
        service: true,
        customerAddress: true,
        bookingRequest: { select: { frequency: true } },
        jobSeries: { select: { frequency: true } },
        assignments: { include: { membership: { include: { user: true } } }, take: 1 },
      },
    }),
    prisma.paymentRecord.groupBy({
      by: ["status"],
      where: { organizationId, status: { in: ["pending", "overdue"] } },
      _sum: { amountCents: true },
      _count: true,
    }),
    prisma.job.count({
      where: {
        organizationId,
        scheduledStartAt: { gte: todayStart, lt: todayEnd },
        status: "completed",
      },
    }),
    prisma.bookingRequest.count({
      where: {
        organizationId,
        createdAt: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.job.count({
      where: {
        organizationId,
        scheduledStartAt: { gte: todayStart },
        status: { notIn: ["cancelled", "completed"] },
        assignments: { none: {} },
      },
    }),
    prisma.job.findMany({
      where: {
        organizationId,
        scheduledStartAt: { gte: sparkStart, lt: todayEnd },
        status: { notIn: ["cancelled"] },
      },
      select: {
        scheduledStartAt: true,
        assignments: { select: { id: true }, take: 1 },
      },
    }),
    prisma.bookingRequest.findMany({
      where: {
        organizationId,
        createdAt: { gte: sparkStart, lt: todayEnd },
      },
      select: { createdAt: true },
    }),
    prisma.paymentRecord.findMany({
      where: {
        organizationId,
        createdAt: { lt: todayEnd },
        OR: [
          { status: { in: ["pending", "overdue"] } },
          { paidAt: { gte: sparkStart, not: null } },
        ],
      },
      select: { createdAt: true, paidAt: true },
    }),
    prisma.job.findMany({
      where: {
        organizationId,
        scheduledStartAt: { gte: sparkStart, lt: todayEnd },
        status: { notIn: ["cancelled", "completed"] },
      },
      select: {
        scheduledStartAt: true,
        assignments: { select: { id: true }, take: 1 },
      },
    }),
    getOrgActivityFeed(organizationId, timeZone, currency, { limit: 5 }),
  ]);

  let outstandingCount = 0;
  for (const row of paymentAgg) {
    outstandingCount += row._count;
  }

  const jobsSparkline = countInBuckets(sparkJobsRaw, (j) => j.scheduledStartAt, dayBuckets);
  const bookingsSparkline = countInBuckets(sparkBookingsRaw, (b) => b.createdAt, dayBuckets);
  const unassignedSparkline = dayBuckets.map(({ start, end }) =>
    sparkUnassignedJobsRaw.filter(
      (j) => j.scheduledStartAt >= start && j.scheduledStartAt < end && j.assignments.length === 0,
    ).length,
  );
  const paymentsSparkline = dayBuckets.map(({ end }) => pendingPaymentsOnDay(sparkPaymentsRaw, end));

  const mapJobRow = (job: (typeof todayJobsRaw)[number]): DashboardJobRow => {
    const customerName = `${job.customer.firstName} ${job.customer.lastName}`.trim();
    const assignee = job.assignments[0]?.membership.user;
    const assigneeName = assignee?.name ?? assignee?.email ?? null;
    const freq = job.jobSeries?.frequency ?? job.bookingRequest?.frequency ?? null;
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
  };

  const queueStats: DashboardQueueStat[] = [
    {
      id: "jobs_today",
      label: "Booked today",
      value: String(todayJobsRaw.length),
      subtext:
        completedTodayCount === 1 ? "1 completed" : `${completedTodayCount} completed`,
      href: "/app/jobs?date=today",
      sparkline7d: jobsSparkline,
      sparklineColor: "#52688F",
    },
    {
      id: "new_bookings",
      label: "Scheduled for today",
      value: String(newBookingsTodayCount),
      subtext: "Today",
      href: "/app/bookings",
      sparkline7d: bookingsSparkline,
      sparklineColor: "#FF5A1F",
    },
    {
      id: "unassigned_today",
      label: "Needs assignment",
      value: String(needsAssignmentCount),
      subtext:
        needsAssignmentCount === 1 ? "1 unassigned" : `${needsAssignmentCount} unassigned`,
      href: "/app/jobs?unassigned=1",
      sparkline7d: unassignedSparkline,
      sparklineColor: "#52688F",
    },
    {
      id: "awaiting_payment",
      label: "Payments pending",
      value: String(outstandingCount),
      subtext: "Awaiting payment",
      href: "/app/payments?status=pending",
      sparkline7d: paymentsSparkline,
      sparklineColor: "#FF5A1F",
    },
  ];

  const upcomingJobs = upcomingJobsRaw.map(mapJobRow);

  const activity = activityFeed.items;

  const firstName = (userName ?? "there").split(" ")[0]!;

  return {
    pageTitle: "Dashboard",
    pageSubtitle: "Overview of your business operations.",
    greetingName: firstName,
    dateLabel: "",
    showPerformance: gettingStartedPercent >= 100,
    queueStats,
    upcomingJobs,
    activity,
  };
}

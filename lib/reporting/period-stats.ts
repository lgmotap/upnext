import { prisma } from "@/lib/db/prisma";
import {
  addDaysYmd,
  formatYmdInTimezone,
  localDateTimeToUtc,
} from "@/lib/datetime/timezone";

export type PeriodBounds = { start: Date; end: Date; fromYmd: string; toYmd: string };

export type ThirtyDaySnapshot = {
  fromYmd: string;
  toYmd: string;
  bookingsCreatedCount: number;
  bookingsCreatedValueCents: number;
  jobsScheduledCount: number;
  jobsScheduledValueCents: number;
  revenueCollectedCents: number;
  revenueDailyCents: number[];
  revenueDailyBars: number[];
};

export function last30DayBounds(timeZone: string, now = new Date()): PeriodBounds {
  const toYmd = formatYmdInTimezone(now, timeZone);
  const fromYmd = addDaysYmd(toYmd, -29);
  return {
    fromYmd,
    toYmd,
    start: localDateTimeToUtc(fromYmd, "00:00", timeZone),
    end: localDateTimeToUtc(addDaysYmd(toYmd, 1), "00:00", timeZone),
  };
}

function dailyBuckets(fromYmd: string, days: number): string[] {
  const out: string[] = [];
  let cursor = fromYmd;
  for (let i = 0; i < days; i++) {
    out.push(cursor);
    cursor = addDaysYmd(cursor, 1);
  }
  return out;
}

export async function getThirtyDaySnapshot(
  organizationId: string,
  timeZone: string,
  now = new Date(),
): Promise<ThirtyDaySnapshot> {
  const { start, end, fromYmd, toYmd } = last30DayBounds(timeZone, now);
  const dayKeys = dailyBuckets(fromYmd, 30);

  const [bookings, jobs, payments] = await Promise.all([
    prisma.bookingRequest.findMany({
      where: { organizationId, createdAt: { gte: start, lt: end } },
      include: { job: { select: { priceCents: true } } },
    }),
    prisma.job.findMany({
      where: {
        organizationId,
        scheduledStartAt: { gte: start, lt: end },
        status: { notIn: ["cancelled"] },
      },
      select: { priceCents: true },
    }),
    prisma.paymentRecord.findMany({
      where: {
        organizationId,
        status: "paid",
        paidAt: { gte: start, lt: end, not: null },
      },
      select: { amountCents: true, paidAt: true },
    }),
  ]);

  const bookingsCreatedValueCents = bookings.reduce(
    (sum, b) => sum + (b.job?.priceCents ?? 0),
    0,
  );
  const jobsScheduledValueCents = jobs.reduce((sum, j) => sum + j.priceCents, 0);
  const revenueCollectedCents = payments.reduce((sum, p) => sum + p.amountCents, 0);

  const revenueDailyCents = dayKeys.map((ymd) => {
    const dayStart = localDateTimeToUtc(ymd, "00:00", timeZone);
    const dayEnd = localDateTimeToUtc(addDaysYmd(ymd, 1), "00:00", timeZone);
    return payments
      .filter((p) => p.paidAt && p.paidAt >= dayStart && p.paidAt < dayEnd)
      .reduce((sum, p) => sum + p.amountCents, 0);
  });

  const maxDaily = Math.max(...revenueDailyCents, 1);
  const revenueDailyBars = revenueDailyCents.map((cents) =>
    Math.round((cents / maxDaily) * 100),
  );

  return {
    fromYmd,
    toYmd,
    bookingsCreatedCount: bookings.length,
    bookingsCreatedValueCents,
    jobsScheduledCount: jobs.length,
    jobsScheduledValueCents,
    revenueCollectedCents,
    revenueDailyCents,
    revenueDailyBars,
  };
}

export async function sumPaidInRange(organizationId: string, start: Date, end: Date) {
  const rows = await prisma.paymentRecord.findMany({
    where: {
      organizationId,
      status: "paid",
      paidAt: { gte: start, lt: end },
    },
    select: { amountCents: true },
  });
  return rows.reduce((s, r) => s + r.amountCents, 0);
}

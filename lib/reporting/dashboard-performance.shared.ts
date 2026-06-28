import {
  addDaysYmd,
  formatYmdInTimezone,
  localDateTimeToUtc,
} from "@/lib/datetime/timezone";
import { buildReportDateRange } from "@/lib/reports/range";
import type { DashboardPerformanceRange } from "@/lib/reporting/dashboard-performance.types";

function last30DayBounds(timeZone: string, now = new Date()) {
  const toYmd = formatYmdInTimezone(now, timeZone);
  const fromYmd = addDaysYmd(toYmd, -29);
  return {
    fromYmd,
    toYmd,
    start: localDateTimeToUtc(fromYmd, "00:00", timeZone),
    end: localDateTimeToUtc(addDaysYmd(toYmd, 1), "00:00", timeZone),
  };
}

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function dayKeysInclusive(fromYmd: string, toYmd: string): string[] {
  const out: string[] = [];
  let cursor = fromYmd;
  while (cursor <= toYmd) {
    out.push(cursor);
    cursor = addDaysYmd(cursor, 1);
  }
  return out;
}

function buildPerformanceRange(fromYmd: string, toYmd: string, timeZone: string): DashboardPerformanceRange {
  const base = buildReportDateRange(fromYmd, toYmd, timeZone);
  const dayCount = dayKeysInclusive(fromYmd, toYmd).length;
  const priorToYmd = addDaysYmd(fromYmd, -1);
  const priorFromYmd = addDaysYmd(priorToYmd, -(dayCount - 1));
  const priorStart = localDateTimeToUtc(priorFromYmd, "00:00", timeZone);
  const priorEnd = localDateTimeToUtc(addDaysYmd(priorToYmd, 1), "00:00", timeZone);

  return {
    ...base,
    priorFromYmd,
    priorToYmd,
    priorStart,
    priorEnd,
    dayCount,
  };
}

export function defaultDashboardPerformanceRange(timeZone: string, now = new Date()): DashboardPerformanceRange {
  const { fromYmd, toYmd } = last30DayBounds(timeZone, now);
  return buildPerformanceRange(fromYmd, toYmd, timeZone);
}

export function defaultDashboardRevenueRange(timeZone: string, now = new Date()): DashboardPerformanceRange {
  return defaultDashboardPerformanceRange(timeZone, now);
}

export function parseDashboardRevenueRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
  timeZone: string,
): { ok: true; range: DashboardPerformanceRange } | { ok: false; error: string } {
  if (!fromRaw && !toRaw) {
    return { ok: true, range: defaultDashboardRevenueRange(timeZone) };
  }
  return parseDashboardPerformanceRange(fromRaw, toRaw, timeZone);
}

export function parseDashboardPerformanceRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
  timeZone: string,
): { ok: true; range: DashboardPerformanceRange } | { ok: false; error: string } {
  const todayYmd = formatYmdInTimezone(new Date(), timeZone);

  if (!fromRaw && !toRaw) {
    return { ok: true, range: defaultDashboardPerformanceRange(timeZone) };
  }

  if (!fromRaw || !toRaw || !YMD_RE.test(fromRaw) || !YMD_RE.test(toRaw)) {
    return { ok: false, error: "Use valid from and to dates (YYYY-MM-DD)." };
  }

  if (fromRaw > toRaw) {
    return { ok: false, error: "Start date must be on or before end date." };
  }

  if (toRaw > todayYmd) {
    return { ok: false, error: "End date cannot be in the future." };
  }

  const start = localDateTimeToUtc(fromRaw, "00:00", timeZone);
  const end = localDateTimeToUtc(addDaysYmd(toRaw, 1), "00:00", timeZone);
  const maxDays = 366;
  if (end.getTime() - start.getTime() > maxDays * 24 * 60 * 60 * 1000) {
    return { ok: false, error: "Date range cannot exceed 366 days." };
  }

  return { ok: true, range: buildPerformanceRange(fromRaw, toRaw, timeZone) };
}

export function dashboardRangePresets(timeZone: string, now = new Date()) {
  const todayYmd = formatYmdInTimezone(now, timeZone);
  const last7From = addDaysYmd(todayYmd, -6);
  const last30 = last30DayBounds(timeZone, now);
  const last90From = addDaysYmd(todayYmd, -89);

  return [
    { label: "Last 7 days", fromYmd: last7From, toYmd: todayYmd },
    { label: "Last 30 days", fromYmd: last30.fromYmd, toYmd: last30.toYmd },
    { label: "Last 90 days", fromYmd: last90From, toYmd: todayYmd },
  ] as const;
}

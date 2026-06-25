import { addDaysYmd, formatYmdInTimezone, localDateTimeToUtc } from "@/lib/datetime/timezone";

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ReportDateRange = {
  fromYmd: string;
  toYmd: string;
  start: Date;
  end: Date;
  label: string;
};

function formatRangeLabel(fromYmd: string, toYmd: string, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const from = localDateTimeToUtc(fromYmd, "12:00", timeZone);
  const to = localDateTimeToUtc(toYmd, "12:00", timeZone);
  return `${fmt.format(from)} – ${fmt.format(to)}`;
}

export function monthToDateRange(timeZone: string, now = new Date()): ReportDateRange {
  const todayYmd = formatYmdInTimezone(now, timeZone);
  const [y, m] = todayYmd.split("-").map(Number);
  const fromYmd = `${y}-${String(m).padStart(2, "0")}-01`;
  return buildReportDateRange(fromYmd, todayYmd, timeZone);
}

export function buildReportDateRange(fromYmd: string, toYmd: string, timeZone: string): ReportDateRange {
  const start = localDateTimeToUtc(fromYmd, "00:00", timeZone);
  const end = localDateTimeToUtc(addDaysYmd(toYmd, 1), "00:00", timeZone);
  return {
    fromYmd,
    toYmd,
    start,
    end,
    label: formatRangeLabel(fromYmd, toYmd, timeZone),
  };
}

/** Parse `from` / `to` query params (YYYY-MM-DD). Defaults to month-to-date. */
export function parseReportDateRange(
  fromRaw: string | undefined,
  toRaw: string | undefined,
  timeZone: string,
): { ok: true; range: ReportDateRange } | { ok: false; error: string } {
  const todayYmd = formatYmdInTimezone(new Date(), timeZone);

  if (!fromRaw && !toRaw) {
    return { ok: true, range: monthToDateRange(timeZone) };
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
  const spanMs = end.getTime() - start.getTime();
  if (spanMs > maxDays * 24 * 60 * 60 * 1000) {
    return { ok: false, error: "Date range cannot exceed 366 days." };
  }

  return { ok: true, range: buildReportDateRange(fromRaw, toRaw, timeZone) };
}

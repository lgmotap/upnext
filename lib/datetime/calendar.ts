import {
  addDaysYmd,
  formatDisplayDateTime,
  formatTimeHmInTimezone,
  formatYmdInTimezone,
  localDateTimeToUtc,
} from "@/lib/datetime/timezone";

export function getWeekRange(timeZone: string, anchor = new Date()) {
  const todayYmd = formatYmdInTimezone(anchor, timeZone);
  const probe = localDateTimeToUtc(todayYmd, "12:00", timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(probe);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = map[weekday] ?? 0;
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStartYmd = addDaysYmd(todayYmd, mondayOffset);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDaysYmd(weekStartYmd, i);
    const startAt = localDateTimeToUtc(date, "00:00", timeZone);
    const label = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(startAt);
    const dayNum = new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(startAt);
    const isToday = date === todayYmd;
    return { date, label, dayNum, isToday, startAt };
  });

  const rangeStart = localDateTimeToUtc(weekStartYmd, "00:00", timeZone);
  const rangeEnd = localDateTimeToUtc(addDaysYmd(weekStartYmd, 7), "00:00", timeZone);

  const weekLabel = `${formatDisplayDateTime(rangeStart, timeZone).replace(/,.*$/, "")} – ${formatDisplayDateTime(new Date(rangeEnd.getTime() - 1), timeZone)}`;

  return { days, rangeStart, rangeEnd, weekLabel, todayYmd };
}

export function formatJobSchedule(start: Date, end: Date, timeZone: string) {
  const date = formatDisplayDateTime(start, timeZone).replace(/,.*$/, "");
  const startTime = formatTimeHmInTimezone(start, timeZone);
  const endTime = formatTimeHmInTimezone(end, timeZone);
  return { date, time: `${startTime} – ${endTime}`, shortTime: startTime };
}

export function formatAddressLine(
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    region: string;
    postalCode: string;
  } | null | undefined,
): string {
  if (!address) return "—";
  const line2 = address.line2 ? `, ${address.line2}` : "";
  return `${address.line1}${line2}, ${address.city}, ${address.region} ${address.postalCode}`;
}

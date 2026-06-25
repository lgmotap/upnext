import {
  addDaysYmd,
  formatDisplayDateTime,
  formatTimeHmInTimezone,
  formatYmdInTimezone,
  localDateTimeToUtc,
} from "@/lib/datetime/timezone";
import { formatMonthLabel, parseMonthKey, shiftMonthKey } from "@/lib/availability/calendar-ui";

export function getWeekStartYmd(timeZone: string, dateYmd: string): string {
  const probe = localDateTimeToUtc(dateYmd, "12:00", timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(probe);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = map[weekday] ?? 0;
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  return addDaysYmd(dateYmd, mondayOffset);
}

export function getWeekRange(timeZone: string, anchor = new Date()) {
  const todayYmd = formatYmdInTimezone(anchor, timeZone);
  const weekStartYmd = getWeekStartYmd(timeZone, todayYmd);

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

  const weekEndYmd = addDaysYmd(weekStartYmd, 6);
  const weekStartLabel = formatShortDate(localDateTimeToUtc(weekStartYmd, "12:00", timeZone), timeZone);
  const weekEndLabel = formatShortDate(localDateTimeToUtc(weekEndYmd, "12:00", timeZone), timeZone);
  const weekLabel =
    weekStartYmd.slice(0, 4) === weekEndYmd.slice(0, 4)
      ? `${weekStartLabel} – ${weekEndLabel}, ${weekStartYmd.slice(0, 4)}`
      : `${weekStartLabel}, ${weekStartYmd.slice(0, 4)} – ${weekEndLabel}, ${weekEndYmd.slice(0, 4)}`;

  return { days, rangeStart, rangeEnd, weekLabel, todayYmd };
}

export function getDayBoundsUtc(dateYmd: string, timeZone: string) {
  const start = localDateTimeToUtc(dateYmd, "00:00", timeZone);
  const end = localDateTimeToUtc(addDaysYmd(dateYmd, 1), "00:00", timeZone);
  return { start, end };
}

export function getMonthRange(timeZone: string, monthKey: string) {
  const { year, month } = parseMonthKey(monthKey);
  const mm = String(month).padStart(2, "0");
  const firstDay = `${year}-${mm}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const lastDay = `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}`;
  const rangeStart = localDateTimeToUtc(firstDay, "00:00", timeZone);
  const rangeEnd = localDateTimeToUtc(addDaysYmd(lastDay, 1), "00:00", timeZone);
  const todayYmd = formatYmdInTimezone(new Date(), timeZone);
  const isCurrentMonth = monthKey === todayYmd.slice(0, 7);
  const monthLabel = formatMonthLabel(monthKey, timeZone);

  return {
    monthKey,
    monthLabel,
    rangeStart,
    rangeEnd,
    todayYmd,
    firstDay,
    lastDay,
    isCurrentMonth,
    prevMonthKey: shiftMonthKey(monthKey, -1),
    nextMonthKey: shiftMonthKey(monthKey, 1),
  };
}

function formatShortDate(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "short", day: "numeric" }).format(date);
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

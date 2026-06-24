import type { BookingFrequency } from "@/generated/prisma/client";
import { addDaysYmd, formatTimeHmInTimezone, formatYmdInTimezone, localDateTimeToUtc } from "@/lib/datetime/timezone";

/** Add one calendar month, clamping day when needed (e.g. Jan 31 → Feb 28). */
export function addMonthsYmd(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

export function calculateNextOccurrence(
  from: Date,
  frequency: BookingFrequency,
  timeZone: string,
): Date {
  const ymd = formatYmdInTimezone(from, timeZone);
  const hm = formatTimeHmInTimezone(from, timeZone);

  let nextYmd: string;
  switch (frequency) {
    case "weekly":
      nextYmd = addDaysYmd(ymd, 7);
      break;
    case "biweekly":
      nextYmd = addDaysYmd(ymd, 14);
      break;
    case "monthly":
      nextYmd = addMonthsYmd(ymd, 1);
      break;
    default:
      return from;
  }

  return localDateTimeToUtc(nextYmd, hm, timeZone);
}

export function isRecurringFrequency(frequency: BookingFrequency): boolean {
  return frequency !== "one_time";
}

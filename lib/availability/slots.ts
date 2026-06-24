import type { BlackoutDate } from "@/generated/prisma/client";
import type { WeeklyRule } from "@/lib/availability/intersect-rules";
import {
  addDaysYmd,
  formatYmdInTimezone,
  localDateTimeToUtc,
  minutesToHm,
  parseHmToMinutes,
} from "@/lib/datetime/timezone";
import { enrichBookableDay, type BookableDay } from "@/lib/availability/calendar-ui";

export type SlotDay = BookableDay;

export type AvailableSlot = {
  date: string;
  time: string;
  startAt: Date;
  endAt: Date;
};

type SlotInput = {
  timeZone: string;
  rules: WeeklyRule[];
  blackouts: BlackoutDate[];
  minNoticeHours: number;
  maxBookingDaysAhead: number;
  slotIntervalMinutes: number;
  serviceDurationMinutes: number;
  now?: Date;
};

export function getAvailableDays(input: SlotInput): SlotDay[] {
  const slots = computeAllSlots(input);
  const uniqueDates = [...new Set(slots.map((s) => s.date))];
  return uniqueDates.map((date) => enrichBookableDay(date, input.timeZone));
}

export function getSlotsForDate(input: SlotInput, dateYmd: string): AvailableSlot[] {
  return computeAllSlots(input).filter((s) => s.date === dateYmd);
}

export function isSlotAvailable(
  input: SlotInput,
  dateYmd: string,
  timeHm: string,
): AvailableSlot | null {
  const slot = getSlotsForDate(input, dateYmd).find((s) => s.time === timeHm);
  return slot ?? null;
}

function computeAllSlots(input: SlotInput): AvailableSlot[] {
  const now = input.now ?? new Date();
  const earliest = new Date(now.getTime() + input.minNoticeHours * 60 * 60 * 1000);
  const todayYmd = formatYmdInTimezone(now, input.timeZone);
  const endYmd = addDaysYmd(todayYmd, input.maxBookingDaysAhead);

  const rulesByDay = Object.fromEntries(input.rules.map((r) => [r.dayOfWeek, r]));
  const slots: AvailableSlot[] = [];

  let cursor = todayYmd;
  while (cursor <= endYmd) {
    const actualDow = getDayOfWeekInTimezone(cursor, input.timeZone);
    const rule = rulesByDay[actualDow];

    if (rule?.isActive) {
      const startMin = parseHmToMinutes(rule.startTime);
      const endMin = parseHmToMinutes(rule.endTime);
      for (let m = startMin; m + input.serviceDurationMinutes <= endMin; m += input.slotIntervalMinutes) {
        const time = minutesToHm(m);
        const startAt = localDateTimeToUtc(cursor, time, input.timeZone);
        const endAt = new Date(startAt.getTime() + input.serviceDurationMinutes * 60_000);

        if (startAt < earliest) continue;
        if (isBlackout(startAt, endAt, input.blackouts)) continue;

        slots.push({ date: cursor, time, startAt, endAt });
      }
    }

    cursor = addDaysYmd(cursor, 1);
  }

  return slots;
}

function getDayOfWeekInTimezone(dateYmd: string, timeZone: string): number {
  const utc = localDateTimeToUtc(dateYmd, "12:00", timeZone);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(utc);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

function isBlackout(startAt: Date, endAt: Date, blackouts: BlackoutDate[]): boolean {
  return blackouts.some((b) => startAt < b.endsAt && endAt > b.startsAt);
}

import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const availabilityRuleSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(timeRegex, "Use HH:mm format"),
  endTime: z.string().regex(timeRegex, "Use HH:mm format"),
  isActive: z.coerce.boolean(),
});

export const weeklyAvailabilitySchema = z.object({
  rules: z.array(availabilityRuleSchema).length(7),
});

export const bookingWindowSchema = z.object({
  minNoticeHours: z.coerce.number().int().min(0).max(168),
  maxBookingDaysAhead: z.coerce.number().int().min(1).max(365),
  slotIntervalMinutes: z.coerce.number().int().min(15).max(120),
});

export const schedulingPolicySchema = z.object({
  bufferMinutesBetweenJobs: z.coerce.number().int().min(0).max(240),
  providerCarryOverMinutes: z.coerce.number().int().min(0).max(240),
});

export const blackoutDateSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  reason: z.string().max(200).trim().optional().or(z.literal("")),
});

export type WeeklyAvailabilityInput = z.infer<typeof weeklyAvailabilitySchema>;
export type BookingWindowInput = z.infer<typeof bookingWindowSchema>;
export type SchedulingPolicyInput = z.infer<typeof schedulingPolicySchema>;

/** Default Mon–Fri 08:00–18:00, Sat 09:00–14:00, Sun closed. */
export function defaultWeeklyRules() {
  return DAY_LABELS.map((_, dayOfWeek) => ({
    dayOfWeek,
    startTime: dayOfWeek === 0 ? "09:00" : "08:00",
    endTime: dayOfWeek === 6 ? "14:00" : dayOfWeek === 0 ? "09:00" : "18:00",
    isActive: dayOfWeek !== 0,
  }));
}

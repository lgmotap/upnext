import { z } from "zod";

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hm = z.string().regex(/^\d{2}:\d{2}$/);

export const rescheduleBySlotSchema = z.object({
  date: ymd,
  time: hm,
});

export const rescheduleJobSchema = rescheduleBySlotSchema.extend({
  jobId: z.string().min(1),
});

export const rescheduleBookingRequestSchema = rescheduleBySlotSchema.extend({
  bookingRequestId: z.string().min(1),
});

export const crewRunningLateSchema = z.object({
  jobId: z.string().min(1),
  etaMinutes: z.coerce.number().int().min(5).max(180).optional(),
});

export const crewOnTheWaySchema = z.object({
  jobId: z.string().min(1),
});

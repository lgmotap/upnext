import type { BookingFrequency } from "@/generated/prisma/client";

export const BOOKING_FREQUENCY_OPTIONS: Array<{
  value: BookingFrequency;
  label: string;
  description: string;
}> = [
  { value: "one_time", label: "One-time", description: "A single visit" },
  { value: "weekly", label: "Weekly", description: "Every week" },
  { value: "biweekly", label: "Bi-weekly", description: "Every two weeks" },
  { value: "monthly", label: "Monthly", description: "Once a month" },
];

export function frequencyLabel(value: BookingFrequency | string | null | undefined): string {
  return BOOKING_FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? "One-time";
}

export function isValidBookingFrequency(value: string): value is BookingFrequency {
  return BOOKING_FREQUENCY_OPTIONS.some((o) => o.value === value);
}

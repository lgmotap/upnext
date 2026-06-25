import type { BookingFrequency } from "@/generated/prisma/client";

export type FrequencyDiscountConfig = {
  frequency: BookingFrequency;
  percentOff: number;
  amountOffCents: number;
};

export function applyFrequencyDiscount(
  priceCents: number,
  frequency: BookingFrequency,
  discounts: FrequencyDiscountConfig[],
): number {
  if (frequency === "one_time") return priceCents;
  const row = discounts.find((d) => d.frequency === frequency);
  if (!row) return priceCents;

  let result = priceCents;
  if (row.percentOff > 0) {
    result = Math.round(result * (1 - Math.min(100, row.percentOff) / 100));
  }
  if (row.amountOffCents > 0) {
    result = Math.max(0, result - row.amountOffCents);
  }
  return result;
}

export function frequencyDiscountLabel(discount: FrequencyDiscountConfig): string | null {
  if (discount.percentOff > 0) return `Save ${discount.percentOff}%`;
  if (discount.amountOffCents > 0) {
    return `Save $${(discount.amountOffCents / 100).toFixed(0)}`;
  }
  return null;
}

export function discountLabelForFrequency(
  frequency: BookingFrequency,
  discounts: FrequencyDiscountConfig[],
): string | null {
  if (frequency === "one_time") return null;
  const row = discounts.find((d) => d.frequency === frequency);
  return row ? frequencyDiscountLabel(row) : null;
}

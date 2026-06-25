import { prisma } from "@/lib/db/prisma";
import type { BookingFrequency } from "@/generated/prisma/client";
import type { FrequencyDiscountConfig } from "@/lib/pricing/frequency-discount";

export function listFrequencyDiscountsForService(serviceId: string) {
  return prisma.serviceFrequencyDiscount.findMany({
    where: { serviceId },
    orderBy: { frequency: "asc" },
  });
}

export function listFrequencyDiscountsForServices(serviceIds: string[]) {
  if (serviceIds.length === 0) return Promise.resolve([]);
  return prisma.serviceFrequencyDiscount.findMany({
    where: { serviceId: { in: serviceIds } },
    orderBy: [{ serviceId: "asc" }, { frequency: "asc" }],
  });
}

export async function replaceServiceFrequencyDiscounts(
  serviceId: string,
  rows: FrequencyDiscountConfig[],
) {
  const cleaned = rows.filter(
    (r) => r.frequency !== "one_time" && (r.percentOff > 0 || r.amountOffCents > 0),
  );

  await prisma.$transaction([
    prisma.serviceFrequencyDiscount.deleteMany({ where: { serviceId } }),
    ...(cleaned.length > 0
      ? [
          prisma.serviceFrequencyDiscount.createMany({
            data: cleaned.map((r) => ({
              serviceId,
              frequency: r.frequency,
              percentOff: Math.min(100, Math.max(0, r.percentOff)),
              amountOffCents: Math.max(0, r.amountOffCents),
            })),
          }),
        ]
      : []),
  ]);
}

export function toFrequencyDiscountConfigs(
  rows: Array<{
    frequency: BookingFrequency;
    percentOff: number;
    amountOffCents: number;
  }>,
): FrequencyDiscountConfig[] {
  return rows.map((r) => ({
    frequency: r.frequency,
    percentOff: r.percentOff,
    amountOffCents: r.amountOffCents,
  }));
}

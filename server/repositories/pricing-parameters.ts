import { prisma } from "@/lib/db/prisma";
import type { PricingParameterType } from "@/generated/prisma/client";
import type { PricingParameterConfig } from "@/lib/pricing/parameters";

export function listPricingParametersForService(serviceId: string) {
  return prisma.servicePricingParameter.findMany({
    where: { serviceId },
    orderBy: [{ sortOrder: "asc" }, { parameterType: "asc" }],
  });
}

export function listPricingParametersForServices(serviceIds: string[]) {
  if (serviceIds.length === 0) return Promise.resolve([]);
  return prisma.servicePricingParameter.findMany({
    where: { serviceId: { in: serviceIds } },
    orderBy: [{ serviceId: "asc" }, { sortOrder: "asc" }, { parameterType: "asc" }],
  });
}

export async function replaceServicePricingParameters(
  serviceId: string,
  parameters: PricingParameterConfig[],
) {
  await prisma.$transaction([
    prisma.servicePricingParameter.deleteMany({ where: { serviceId } }),
    ...(parameters.length > 0
      ? [
          prisma.servicePricingParameter.createMany({
            data: parameters.map((p, index) => ({
              serviceId,
              parameterType: p.parameterType,
              unitPriceCents: p.unitPriceCents,
              includedUnits: p.includedUnits,
              maxUnits: p.maxUnits,
              sortOrder: index,
            })),
          }),
        ]
      : []),
  ]);
}

export function createBookingRequestParameters(
  bookingRequestId: string,
  values: Record<PricingParameterType, number>,
) {
  const entries = Object.entries(values) as Array<[PricingParameterType, number]>;
  if (entries.length === 0) return Promise.resolve();
  return prisma.bookingRequestParameter.createMany({
    data: entries.map(([parameterType, units]) => ({
      bookingRequestId,
      parameterType,
      units,
    })),
  });
}

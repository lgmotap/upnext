import { prisma } from "@/lib/db/prisma";
import { getIndustryCatalog, listCatalogServices } from "@/lib/onboarding/industry-catalog";
import { saveWeeklyAvailability } from "@/server/services/availability";
import { defaultWeeklyRules } from "@/server/validators/availability";

export type SeedCatalogResult = {
  seeded: boolean;
  primaryCount: number;
  addonCount: number;
  skipped: number;
};

export async function seedIndustryCatalogIfEmpty(
  organizationId: string,
  currency: string,
  businessType: string,
): Promise<SeedCatalogResult> {
  const existing = await prisma.service.count({ where: { organizationId } });
  if (existing > 0) {
    return { seeded: false, primaryCount: 0, addonCount: 0, skipped: existing };
  }
  return seedIndustryCatalog(organizationId, currency, businessType);
}

/** Adds catalog services that are not already present (match by name, case-insensitive). */
export async function seedIndustryCatalog(
  organizationId: string,
  currency: string,
  businessType: string,
): Promise<SeedCatalogResult> {
  const catalog = getIndustryCatalog(businessType);
  const existing = await prisma.service.findMany({
    where: { organizationId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((s) => s.name.toLowerCase()));

  const toCreate = listCatalogServices(businessType).filter(
    (s) => !existingNames.has(s.name.toLowerCase()),
  );

  if (toCreate.length === 0) {
    return {
      seeded: false,
      primaryCount: catalog.primary.length,
      addonCount: catalog.addons.length,
      skipped: existing.length,
    };
  }

  const maxSort = await prisma.service.aggregate({
    where: { organizationId },
    _max: { sortOrder: true },
  });
  let sortOrder = (maxSort._max.sortOrder ?? -1) + 1;

  await prisma.$transaction(
    toCreate.map((item) =>
      prisma.service.create({
        data: {
          organizationId,
          name: item.name,
          description: item.description,
          durationMinutes: item.durationMinutes,
          basePriceCents: item.basePriceCents,
          currency,
          isActive: true,
          isPublic: true,
          isAddon: item.isAddon,
          sortOrder: sortOrder++,
        },
      }),
    ),
  );

  const rules = await prisma.availabilityRule.count({ where: { organizationId } });
  if (rules === 0) {
    await saveWeeklyAvailability(organizationId, { rules: defaultWeeklyRules() });
  }

  const primaryAdded = toCreate.filter((s) => !s.isAddon).length;
  const addonAdded = toCreate.filter((s) => s.isAddon).length;

  return {
    seeded: true,
    primaryCount: primaryAdded,
    addonCount: addonAdded,
    skipped: existing.length,
  };
}

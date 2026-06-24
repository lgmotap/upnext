import { prisma } from "@/lib/db/prisma";
import {
  getIndustryCatalog,
  listCatalogServices,
} from "@/lib/onboarding/industry-catalog";
import { resolveIconKeyForServiceName } from "@/lib/onboarding/service-icons";
import { saveWeeklyAvailability } from "@/server/services/availability";
import { defaultWeeklyRules } from "@/server/validators/availability";
import { replaceServicePricingParameters } from "@/server/repositories/pricing-parameters";

export const DEFAULT_BUSINESS_TYPE = "Residential Cleaning";

export type SeedCatalogResult = {
  seeded: boolean;
  primaryCount: number;
  addonCount: number;
  skipped: number;
};

/** Ensures default business type, icon keys, and full industry catalog for an org. */
export async function ensureIndustryCatalogForOrg(
  organizationId: string,
): Promise<SeedCatalogResult> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: { businessProfile: true },
  });
  if (!org?.businessProfile) {
    return { seeded: false, primaryCount: 0, addonCount: 0, skipped: 0 };
  }

  const businessType = org.businessProfile.businessType ?? DEFAULT_BUSINESS_TYPE;
  if (!org.businessProfile.businessType) {
    await prisma.businessProfile.update({
      where: { organizationId },
      data: { businessType },
    });
  }

  await backfillServiceIconKeys(organizationId, businessType);
  return seedIndustryCatalog(organizationId, org.currency, businessType);
}

/** @deprecated Use ensureIndustryCatalogForOrg */
export async function seedIndustryCatalogIfEmpty(
  organizationId: string,
  currency: string,
  businessType: string,
): Promise<SeedCatalogResult> {
  const primaryCount = await prisma.service.count({
    where: { organizationId, isAddon: false },
  });
  if (primaryCount > 0) {
    return seedIndustryCatalog(organizationId, currency, businessType);
  }
  return ensureIndustryCatalogForOrg(organizationId);
}

async function backfillServiceIconKeys(organizationId: string, businessType: string) {
  const catalogByName = new Map(
    listCatalogServices(businessType).map((s) => [s.name.toLowerCase(), s]),
  );

  const services = await prisma.service.findMany({
    where: { organizationId, iconKey: null },
    select: { id: true, name: true, isAddon: true },
  });

  for (const s of services) {
    const catalogItem = catalogByName.get(s.name.toLowerCase());
    const iconKey =
      catalogItem?.iconKey ?? resolveIconKeyForServiceName(s.name, s.isAddon);
    await prisma.service.update({
      where: { id: s.id },
      data: { iconKey },
    });
  }
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
          iconKey: item.iconKey,
          sortOrder: sortOrder++,
        },
      }),
    ),
  );

  for (const item of toCreate) {
    if (!item.pricingParameters?.length) continue;
    const created = await prisma.service.findFirst({
      where: { organizationId, name: item.name },
      select: { id: true },
    });
    if (created) {
      await replaceServicePricingParameters(created.id, item.pricingParameters);
    }
  }

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

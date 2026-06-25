import { prisma } from "@/lib/db/prisma";
import {
  cleaningFaqDefaults,
  getPortalFaqFromProfile,
  isCleaningBusinessType,
  parsePortalFaqJson,
  type PortalFaqItem,
} from "@/lib/portal/faq";

export async function ensurePortalFaqDefaults(organizationId: string): Promise<PortalFaqItem[]> {
  const profile = await prisma.businessProfile.findUnique({
    where: { organizationId },
    select: { portalFaqJson: true, businessType: true },
  });
  if (!profile) return [];

  const existing = parsePortalFaqJson(profile.portalFaqJson);
  if (existing.length > 0) return existing;
  if (!isCleaningBusinessType(profile.businessType)) return [];

  const defaults = cleaningFaqDefaults();
  await prisma.businessProfile.update({
    where: { organizationId },
    data: { portalFaqJson: defaults },
  });
  return defaults;
}

export { getPortalFaqFromProfile };

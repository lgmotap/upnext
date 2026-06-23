import { prisma } from "@/lib/db/prisma";
import type { BusinessSetupInput } from "@/server/validators/onboarding";

/**
 * Apply onboarding business setup. Updates organization-level settings
 * (timezone, currency) and the public-facing BusinessProfile in one
 * transaction. Caller must have verified org membership + canManageBusiness.
 */
export async function updateBusinessSetup(organizationId: string, input: BusinessSetupInput) {
  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.update({
      where: { id: organizationId },
      data: {
        name: input.displayName,
        timezone: input.timezone,
        currency: input.currency,
      },
    });

    const businessProfile = await tx.businessProfile.update({
      where: { organizationId },
      data: {
        displayName: input.displayName,
        serviceArea: input.serviceArea || null,
        phone: input.phone || null,
        description: input.description || null,
      },
    });

    return { organization, businessProfile };
  });
}

/** The org + public profile for the signed-in user's workspace (onboarding prefill). */
export async function getBusinessSetup(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: { businessProfile: true },
  });
}

import { prisma } from "@/lib/db/prisma";
import type { BusinessSetupInput } from "@/server/validators/onboarding";
import type { BusinessSettingsInput } from "@/server/validators/business";

export async function updateBusinessSettings(organizationId: string, input: BusinessSettingsInput) {
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
        email: input.email || null,
        description: input.description || null,
      },
    });

    return { organization, businessProfile };
  });
}

/** Onboarding uses the same shape without profile email. */
export async function updateBusinessSetup(organizationId: string, input: BusinessSetupInput) {
  return updateBusinessSettings(organizationId, { ...input, email: "" });
}

/** The org + public profile for the signed-in user's workspace. */
export async function getBusinessSetup(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: { businessProfile: true },
  });
}

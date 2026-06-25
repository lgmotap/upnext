import { prisma } from "@/lib/db/prisma";
import type { BusinessSetupInput } from "@/server/validators/onboarding";
import type { BusinessSettingsInput } from "@/server/validators/business";
import { syncDefaultLocationFromProfile } from "@/server/services/locations";

export async function updateBusinessSettings(organizationId: string, input: BusinessSettingsInput) {
  const result = await prisma.$transaction(async (tx) => {
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
        businessType: input.businessType,
        teamSize: input.teamSize,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        country: input.country,
        serviceArea: input.serviceArea || null,
        phone: input.phone || null,
        email: input.email || null,
        description: input.description || null,
        websiteUrl: input.websiteUrl || null,
        serviceAreaEnforcementMode: input.serviceAreaEnforcementMode,
        serviceAreaRadiusMiles: input.serviceAreaRadiusMiles,
        serviceAreaZipCodesJson: input.serviceAreaZipCodesJson ?? undefined,
        addressLatitude: input.addressLatitude,
        addressLongitude: input.addressLongitude,
      },
    });

    return { organization, businessProfile };
  });

  await syncDefaultLocationFromProfile(organizationId);
  return result;
}

/** Full onboarding wizard — industry, address, profile, completion flag. */
export async function updateBusinessSetup(organizationId: string, input: BusinessSetupInput) {
  const result = await prisma.$transaction(async (tx) => {
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
        businessType: input.businessType,
        teamSize: input.teamSize,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
        country: input.country,
        serviceArea: input.serviceArea || null,
        phone: input.phone || null,
        description: input.description || null,
        onboardingCompletedAt: new Date(),
      },
    });

    return { organization, businessProfile };
  });

  await syncDefaultLocationFromProfile(organizationId);
  return result;
}

/** The org + public profile for the signed-in user's workspace. */
export async function getBusinessSetup(organizationId: string) {
  return prisma.organization.findUnique({
    where: { id: organizationId },
    include: { businessProfile: true },
  });
}

/**
 * Smoke: business profile settings — service area scope, website, address fields.
 * Run: npm run smoke:business-profile
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { createWorkspaceForNewUser } = await import("../server/services/onboarding");
const { updateBusinessSettings } = await import("../server/services/business");
const { businessSettingsSchema } = await import("../server/validators/business");
const { formatServiceAreaDisplay } = await import("../lib/business/service-area");

async function main() {
  console.log("▶ Business profile settings smoke\n");

  const suffix = randomUUID().slice(0, 8);
  const businessName = `Profile Smoke ${suffix}`;
  const userId = `profile-smoke-${suffix}`;
  const email = `profile-smoke+${suffix}@upnext.local`;

  const { organization } = await createWorkspaceForNewUser({
    userId,
    email,
    name: "Profile Smoke Owner",
    businessName,
  });

  const parsed = businessSettingsSchema.safeParse({
    businessType: "Residential Cleaning",
    teamSize: "Just me",
    addressLine1: "200 Profile Ave",
    addressLine2: "",
    city: "Austin",
    region: "TX",
    postalCode: "78701",
    country: "US",
    displayName: businessName,
    timezone: "America/Chicago",
    currency: "USD",
    serviceAreaScope: "metro",
    serviceAreaCustom: "",
    phone: "512-555-0199",
    email: "hello@profile-smoke.test",
    description: "Profile smoke business",
    websiteUrl: "https://profile-smoke.example.com",
  });

  if (!parsed.success) {
    console.error("✗ Validator failed:", parsed.error.flatten());
    process.exit(1);
  }

  await updateBusinessSettings(organization.id, parsed.data);

  const profile = await prisma.businessProfile.findUnique({
    where: { organizationId: organization.id },
  });
  if (!profile) throw new Error("BusinessProfile missing");

  const expectedArea = formatServiceAreaDisplay("Austin", "TX", "metro");
  if (profile.serviceArea !== expectedArea) {
    throw new Error(`Expected serviceArea "${expectedArea}", got "${profile.serviceArea}"`);
  }
  if (profile.websiteUrl !== "https://profile-smoke.example.com") {
    throw new Error(`Unexpected websiteUrl: ${profile.websiteUrl}`);
  }
  if (profile.city !== "Austin" || profile.region !== "TX") {
    throw new Error("Address fields not saved");
  }

  console.log(`✓ Service area: ${profile.serviceArea}`);
  console.log(`✓ Website: ${profile.websiteUrl}`);
  console.log("✓ Business profile settings smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

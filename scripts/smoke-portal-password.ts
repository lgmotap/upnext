/**
 * Smoke: portal password login path (Supabase env-gated).
 * Run: npm run smoke:portal-password
 */
import { config } from "dotenv";
import { randomBytes, randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { isBackendConfigured } = await import("../lib/env");
const { ensurePortalSupabaseUser, signInPortalWithPassword } = await import(
  "../server/services/portal-auth"
);
const { createAdminClient } = await import("../lib/supabase/admin");

const SLUG = "smoke-portal-password";

async function main() {
  console.log("▶ Portal password login smoke\n");

  if (!isBackendConfigured()) {
    console.log("⚠ Backend not configured — skipping Supabase password path");
    process.exit(0);
  }

  let org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: SLUG } },
    include: { businessProfile: true },
  });

  if (!org?.businessProfile) {
    const user = await prisma.user.upsert({
      where: { id: "smoke-portal-password-user" },
      create: {
        id: "smoke-portal-password-user",
        email: "portal-password@upnext.local",
        name: "Portal Password",
      },
      update: {},
    });

    org = await prisma.organization.create({
      data: {
        name: "Portal Password Co",
        slug: `portal-password-${randomUUID().slice(0, 8)}`,
        ownerId: user.id,
        timezone: "America/New_York",
        memberships: { create: { userId: user.id, role: "owner", status: "active" } },
        businessProfile: {
          create: {
            displayName: "Portal Password Co",
            publicSlug: SLUG,
            bookingEnabled: true,
            customerPortalEnabled: true,
            portalPasswordLoginEnabled: true,
          },
        },
      },
      include: { businessProfile: true },
    });
    console.log("✓ Seeded org");
  }

  const profile = org.businessProfile;
  if (!profile) throw new Error("No business profile");

  await prisma.businessProfile.update({
    where: { organizationId: org.id },
    data: { portalPasswordLoginEnabled: true },
  });

  let customer = await prisma.customer.findFirst({
    where: { organizationId: org.id, email: "password-test@example.com" },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        organizationId: org.id,
        firstName: "Password",
        lastName: "Tester",
        email: "password-test@example.com",
      },
    });
  }

  const testPassword = `Test-${randomBytes(8).toString("hex")}!1`;

  const ensured = await ensurePortalSupabaseUser({
    organizationId: org.id,
    customerId: customer.id,
    email: customer.email,
    businessSlug: profile.publicSlug,
  });
  if (!ensured.ok) throw new Error(ensured.error);

  const admin = createAdminClient();
  const { error: pwdError } = await admin.auth.admin.updateUserById(ensured.portalUserId, {
    password: testPassword,
  });
  if (pwdError) throw new Error(`Could not set test password: ${pwdError.message}`);

  const signIn = await signInPortalWithPassword(
    profile.publicSlug,
    customer.email,
    testPassword,
    "smoke-portal-password",
  );
  if (!signIn.ok) throw new Error(`Password sign-in failed: ${signIn.error}`);

  if (signIn.session.customerId !== customer.id) {
    throw new Error("Session customerId mismatch");
  }

  console.log(`✓ Business: ${profile.displayName}`);
  console.log(`✓ Customer: ${customer.email}`);
  console.log(`✓ Portal Supabase user linked`);
  console.log(`✓ Password sign-in OK`);
  console.log("\n✅ Portal password smoke passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

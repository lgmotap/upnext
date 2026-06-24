/**
 * Smoke: customer portal magic link + session + dashboard data.
 * Run: npx tsx scripts/smoke-customer-portal.ts
 */
import { config } from "dotenv";
import { randomBytes } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const {
  requestCustomerPortalMagicLink,
  verifyCustomerPortalMagicLink,
  getPortalDashboardData,
  createPrefillLink,
} = await import("../server/services/customer-portal");
const { signPortalSession, verifyPortalSession } = await import("../lib/portal/session");
const { verifyBookingPrefillToken } = await import("../lib/portal/prefill-token");

async function main() {
  console.log("▶ Customer portal smoke\n");

  const profile = await prisma.businessProfile.findFirst({
    where: { customerPortalEnabled: true },
    orderBy: { createdAt: "desc" },
    select: { publicSlug: true, organizationId: true, displayName: true },
  });
  if (!profile) throw new Error("No business profile with portal enabled");

  const customer = await prisma.customer.findFirst({
    where: { organizationId: profile.organizationId },
    orderBy: { createdAt: "desc" },
  });
  if (!customer) throw new Error("No customer for org — run smoke:e2e first");

  const tokenRow = await prisma.customerPortalToken.create({
    data: {
      organizationId: profile.organizationId,
      customerId: customer.id,
      token: randomBytes(32).toString("hex"),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const verify = await verifyCustomerPortalMagicLink(profile.publicSlug, tokenRow.token);
  if (!verify.ok) throw new Error(`Verify failed: ${verify.error}`);

  const sessionToken = signPortalSession(verify.session);
  const session = verifyPortalSession(sessionToken);
  if (!session) throw new Error("Session sign/verify failed");

  const dashboard = await getPortalDashboardData(session);
  if (!dashboard) throw new Error("Dashboard data null");
  if (dashboard.bookings.length === 0) {
    console.warn("⚠ No bookings on dashboard (OK for fresh org)");
  }

  const prefillUrl = createPrefillLink(profile.publicSlug, customer.id, profile.organizationId);
  const prefillParam = new URL(prefillUrl).searchParams.get("prefill");
  if (!prefillParam || !verifyBookingPrefillToken(prefillParam)) {
    throw new Error("Prefill token invalid");
  }

  const magic = await requestCustomerPortalMagicLink(
    profile.publicSlug,
    customer.email,
    "smoke-test-ip",
  );
  if (!magic.ok) throw new Error(magic.error);

  console.log(`✓ Business: ${profile.displayName}`);
  console.log(`✓ Customer: ${customer.email}`);
  console.log(`✓ Dashboard bookings: ${dashboard.bookings.length}`);
  console.log(`✓ Prefill URL OK`);
  console.log(`✓ Magic link request OK`);
  console.log("\n✅ Customer portal smoke passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

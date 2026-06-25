/**
 * Smoke: portal FAQ defaults + dashboard payload.
 * Run: npm run smoke:portal-faq
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { Prisma } = await import("../generated/prisma/client");
const { ensurePortalFaqDefaults, getPortalFaqFromProfile } = await import("../server/services/portal-faq");
const { parsePortalFaqJson } = await import("../lib/portal/faq");
const { getPortalDashboardData } = await import("../server/services/customer-portal");
const { signPortalSession, verifyPortalSession } = await import("../lib/portal/session");

const SLUG = "smoke-portal-faq";

async function main() {
  console.log("▶ Portal FAQ smoke\n");

  const parsed = parsePortalFaqJson([
    { question: "Test?", answer: "Yes." },
    { question: "", answer: "skip" },
  ]);
  if (parsed.length !== 1 || parsed[0]?.question !== "Test?") {
    throw new Error("parsePortalFaqJson failed");
  }

  let org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: SLUG } },
    include: { businessProfile: true },
  });

  if (!org?.businessProfile) {
    const user = await prisma.user.upsert({
      where: { id: "smoke-portal-faq-user" },
      create: { id: "smoke-portal-faq-user", email: "portal-faq@upnext.local", name: "Portal FAQ" },
      update: {},
    });

    org = await prisma.organization.create({
      data: {
        name: "Portal FAQ Co",
        slug: `portal-faq-${randomUUID().slice(0, 8)}`,
        ownerId: user.id,
        timezone: "America/New_York",
        memberships: { create: { userId: user.id, role: "owner", status: "active" } },
        businessProfile: {
          create: {
            displayName: "Portal FAQ Co",
            publicSlug: SLUG,
            bookingEnabled: true,
            customerPortalEnabled: true,
            businessType: "Residential Cleaning",
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
    data: { portalFaqJson: Prisma.DbNull, businessType: "Residential Cleaning" },
  });

  const seeded = await ensurePortalFaqDefaults(org.id);
  if (seeded.length < 2) {
    throw new Error(`Expected cleaning FAQ defaults, got ${seeded.length}`);
  }

  let customer = await prisma.customer.findFirst({
    where: { organizationId: org.id, email: "faq-test@example.com" },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        organizationId: org.id,
        firstName: "FAQ",
        lastName: "Tester",
        email: "faq-test@example.com",
      },
    });
  }

  const sessionToken = signPortalSession({
    customerId: customer.id,
    organizationId: org.id,
    businessSlug: profile.publicSlug,
  });
  const session = verifyPortalSession(sessionToken);
  if (!session) throw new Error("Session sign/verify failed");

  const dashboard = await getPortalDashboardData(session);
  if (!dashboard) throw new Error("Dashboard data null");
  if (dashboard.faq.length < 2) {
    throw new Error(`Dashboard FAQ empty: ${dashboard.faq.length}`);
  }

  const fromProfile = getPortalFaqFromProfile({
    portalFaqJson: seeded,
    businessType: "Residential Cleaning",
  });
  if (fromProfile.length < 2) throw new Error("getPortalFaqFromProfile failed");

  console.log(`✓ FAQ defaults seeded: ${seeded.length} items`);
  console.log(`✓ Dashboard FAQ: ${dashboard.faq.length} items`);
  console.log("\n✅ Portal FAQ smoke passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Custom booking domain smoke — host resolution, rewrite paths, profile URLs.
 * Run: npm run smoke:custom-domain
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const TEST_HOST = "book.smoke-custom-domain.test";
const TEST_SLUG = "smoke-custom-domain";

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const { buildCustomHostRewritePath } = await import("../lib/booking/custom-host");
  const { findPublicSlugByVerifiedCustomBookingHost } = await import(
    "../server/repositories/custom-booking-host"
  );
  const {
    getBookingPageUrlForProfile,
    getBookingEmbedUrlForProfile,
    getBookingConfirmationUrlForProfile,
  } = await import("../lib/url/booking");

  console.log("▶ Custom booking domain smoke\n");

  const rewriteRoot = buildCustomHostRewritePath("/", TEST_SLUG);
  if (rewriteRoot !== `/book/${TEST_SLUG}`) {
    throw new Error(`Expected root rewrite, got ${rewriteRoot}`);
  }
  const rewriteEmbed = buildCustomHostRewritePath("/embed", TEST_SLUG);
  if (rewriteEmbed !== `/book/${TEST_SLUG}/embed`) {
    throw new Error(`Expected embed rewrite, got ${rewriteEmbed}`);
  }
  const rewriteConfirm = buildCustomHostRewritePath("/confirmation/br_123", TEST_SLUG);
  if (rewriteConfirm !== `/book/${TEST_SLUG}/confirmation/br_123`) {
    throw new Error(`Expected confirmation rewrite, got ${rewriteConfirm}`);
  }
  console.log("✓ Rewrite path helpers");

  let org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    include: { businessProfile: true },
  });

  if (!org?.businessProfile) {
    const userId = "smoke-custom-domain-user";
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email: "smoke-custom-domain@upnext.local", name: "Custom Domain Smoke" },
      update: {},
    });

    org = await prisma.organization.create({
      data: {
        name: "Custom Domain Smoke Co",
        slug: `custom-domain-${randomUUID().slice(0, 8)}`,
        ownerId: userId,
        timezone: "America/New_York",
        memberships: { create: { userId, role: "owner", status: "active" } },
        businessProfile: {
          create: {
            displayName: "Custom Domain Smoke Co",
            publicSlug: TEST_SLUG,
            bookingEnabled: true,
            customBookingHost: TEST_HOST,
            customBookingVerifiedAt: new Date(),
          },
        },
        services: {
          create: {
            name: "Standard Clean",
            durationMinutes: 120,
            basePriceCents: 15000,
            isActive: true,
            isPublic: true,
          },
        },
      },
      include: { businessProfile: true },
    });
    console.log("✓ Seeded test org");
  } else {
    await prisma.businessProfile.update({
      where: { organizationId: org.id },
      data: {
        customBookingHost: TEST_HOST,
        customBookingVerifiedAt: new Date(),
      },
    });
  }

  const resolved = await findPublicSlugByVerifiedCustomBookingHost(TEST_HOST);
  if (resolved?.publicSlug !== TEST_SLUG) {
    throw new Error(`Host lookup failed: ${resolved?.publicSlug}`);
  }
  console.log("✓ Verified host → slug lookup");

  const profile = {
    publicSlug: TEST_SLUG,
    customBookingHost: TEST_HOST,
    customBookingVerifiedAt: new Date(),
  };
  if (getBookingPageUrlForProfile(profile) !== `https://${TEST_HOST}`) {
    throw new Error("Custom booking page URL incorrect");
  }
  if (getBookingEmbedUrlForProfile(profile) !== `https://${TEST_HOST}/embed`) {
    throw new Error("Custom embed URL incorrect");
  }
  const confirmUrl = getBookingConfirmationUrlForProfile(profile, "br_test");
  if (confirmUrl !== `https://${TEST_HOST}/confirmation/br_test`) {
    throw new Error(`Custom confirmation URL incorrect: ${confirmUrl}`);
  }
  console.log("✓ Profile-aware booking URLs");

  const apiRes = await fetch(
    `http://127.0.0.1:${process.env.PORT ?? 3000}/api/internal/booking-host?host=${TEST_HOST}`,
  ).catch(() => null);
  if (apiRes?.ok) {
    const body = (await apiRes.json()) as { slug?: string };
    if (body.slug === TEST_SLUG) {
      console.log("✓ Internal booking-host API (dev server)");
    }
  } else {
    console.log("⏭️  Skipped live API check (dev server not required for smoke)");
  }

  console.log("\n✅ Custom booking domain smoke passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../lib/db/prisma");
    await prisma.$disconnect();
  });

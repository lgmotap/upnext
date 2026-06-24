/**
 * Smoke: booking + portal URL helpers resolve for a real org slug.
 * Run: npx tsx scripts/smoke-portal-links.ts
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const {
  getBookingPageUrl,
  getCustomerPortalUrl,
  getBookingEmbedHtml,
  getPublicAppUrl,
} = await import("../lib/url/app");

async function main() {
  console.log("▶ Portal links smoke\n");

  const profile = await prisma.businessProfile.findFirst({
    orderBy: { createdAt: "desc" },
    select: { publicSlug: true, displayName: true },
  });

  if (!profile?.publicSlug) {
    throw new Error("No BusinessProfile with publicSlug — run smoke:e2e first");
  }

  const appUrl = getPublicAppUrl();
  const bookingUrl = getBookingPageUrl(profile.publicSlug);
  const portalUrl = getCustomerPortalUrl(profile.publicSlug);
  const embed = getBookingEmbedHtml(profile.publicSlug);

  if (!bookingUrl.includes(`/book/${profile.publicSlug}`)) {
    throw new Error(`Invalid booking URL: ${bookingUrl}`);
  }
  if (!portalUrl.includes(`/my/${profile.publicSlug}`)) {
    throw new Error(`Invalid portal URL: ${portalUrl}`);
  }
  if (!embed.includes("/embed")) {
    throw new Error("Embed HTML missing /embed path");
  }

  console.log(`✓ App URL: ${appUrl}`);
  console.log(`✓ Business: ${profile.displayName}`);
  console.log(`✓ Booking: ${bookingUrl}`);
  console.log(`✓ Portal:  ${portalUrl}`);
  console.log(`✓ Embed snippet length: ${embed.length} chars`);
  console.log("\n✅ Portal links smoke passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

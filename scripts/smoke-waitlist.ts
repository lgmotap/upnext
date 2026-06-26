/**
 * Smoke: waitlist lead storage + thank-you email.
 * Run: npm run smoke:waitlist
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { submitWaitlistLead } = await import("../server/services/waitlist");
const { isResendConfigured } = await import("../lib/resend/config");
const {
  waitlistThankYouHtml,
  waitlistThankYouSubject,
  waitlistThankYouText,
} = await import("../lib/email/waitlist-thank-you");

const TEST_EMAIL = `waitlist-smoke-${Date.now()}@example.com`;

async function main() {
  console.log("▶ Waitlist smoke test\n");

  const subject = waitlistThankYouSubject();
  const html = waitlistThankYouHtml({ firstName: "Alex", businessName: "Sparkle Co" });
  const text = waitlistThankYouText({ firstName: "Alex", businessName: "Sparkle Co" });

  if (!subject.includes("BookedFox") || !html.includes("You're on the list") || !text.includes("Alex")) {
    throw new Error("Waitlist email template missing expected content");
  }
  console.log("✓ Branded email template renders");

  const result = await submitWaitlistLead(
    {
      firstName: "Alex",
      email: TEST_EMAIL,
      businessName: "Sparkle Smoke Co",
      businessType: "Residential Cleaning",
      businessSize: "Just me",
      currentTool: "Spreadsheet",
      source: "/smoke",
    },
    "smoke-local",
  );

  if (!result.stored) throw new Error("Expected new waitlist lead to be stored");
  console.log("✓ Lead stored in database");

  const lead = await prisma.waitlistLead.findUnique({ where: { email: TEST_EMAIL } });
  if (!lead) throw new Error("Lead not found after submit");

  if (isResendConfigured()) {
    if (!lead.thankYouSentAt) {
      console.log("⚠ Resend configured but thankYouSentAt not set (check API key / domain)");
    } else {
      console.log("✓ Thank-you email marked sent");
    }
  } else {
    console.log("⚠ RESEND_API_KEY not set — email send skipped (storage still works)");
  }

  await prisma.waitlistLead.delete({ where: { id: lead.id } });
  console.log("✓ Cleanup complete");

  console.log("\n✅ Waitlist smoke passed");
}

main()
  .catch((err) => {
    console.error("\n✗ Waitlist smoke FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Smoke: SMS notification settings + mock send logging.
 * Run: npm run smoke:sms
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { notifyJobOnTheWay } = await import("../server/services/notifications");
const { updateSmsNotificationPreferences } = await import("../server/repositories/notification-preferences");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ SMS notifications smoke\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
    select: { id: true },
  });
  if (!org) throw new Error("Run smoke:e2e first — missing smoke-test-co org");

  await updateSmsNotificationPreferences(org.id, {
    smsEnabled: true,
    smsFromNumber: "+15555550100",
    notifyCustomerSmsReminder24h: true,
    notifyCustomerSmsOnTheWay: true,
    notifyCustomerSmsRunningLate: true,
    notifyWorkerSmsJobAssigned: false,
  });
  console.log("✓ SMS prefs enabled");

  const job = await prisma.job.findFirst({
    where: { organizationId: org.id, status: { in: ["scheduled", "confirmed"] } },
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
  if (!job) throw new Error("No job for SMS smoke");

  if (!job.customer.phone) {
    await prisma.customer.update({
      where: { id: job.customerId },
      data: { phone: "+15555550123" },
    });
    console.log("✓ Set customer phone for SMS");
  }

  await notifyJobOnTheWay(org.id, job.id);

  const smsLog = await prisma.notificationLog.findFirst({
    where: {
      organizationId: org.id,
      relatedId: job.id,
      template: "job_on_the_way",
      channel: "sms",
    },
    orderBy: { sentAt: "desc" },
  });
  if (!smsLog) throw new Error("Missing SMS notification log");
  console.log(`✓ SMS job_on_the_way logged (${smsLog.status})`);

  console.log("\n✅ SMS smoke passed");
}

main()
  .catch((e) => {
    console.error("✗", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

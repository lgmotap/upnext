/**
 * Smoke: portal saved card → pay outstanding balance via PaymentIntent.
 * Requires STRIPE_SECRET_KEY. Skips gracefully when unset.
 * Run: npm run smoke:portal-saved-card
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const TEST_SLUG = "smoke-test-co";
const SMOKE_CONNECT_ACCOUNT_ID = "acct_1TlczsRAIBDcdZbR";

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const { isStripeConfigured } = await import("../lib/stripe/client");
  const { getOrCreateStripeCustomer, payPortalPaymentWithSavedCard } = await import(
    "../server/services/portal-payments"
  );

  if (!isStripeConfigured()) {
    console.log("⚠ STRIPE_SECRET_KEY not set — skipping portal saved-card smoke");
    process.exit(0);
  }

  const stripe = (await import("../lib/stripe/client")).getStripe();
  if (!stripe) throw new Error("Stripe client unavailable");

  console.log("▶ Portal saved-card payment smoke\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
  });
  if (!org) throw new Error(`Run npm run smoke:e2e first — org ${TEST_SLUG} missing`);

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      stripeConnectAccountId: SMOKE_CONNECT_ACCOUNT_ID,
      stripeConnectChargesEnabled: true,
    },
  });

  const job = await prisma.job.findFirst({
    where: { organizationId: org.id, status: "scheduled" },
    include: { paymentRecord: true, customer: true },
    orderBy: { createdAt: "desc" },
  });
  if (!job?.paymentRecord || !job.customer) {
    throw new Error("No job with payment — run npm run smoke:e2e first");
  }

  if (job.paymentRecord.status === "paid") {
    await prisma.paymentRecord.update({
      where: { id: job.paymentRecord.id },
      data: {
        status: "pending",
        provider: "stripe",
        paidAt: null,
        stripePaymentIntentId: null,
      },
    });
  }

  const stripeCustomerId = await getOrCreateStripeCustomer(org.id, job.customerId);
  if (!stripeCustomerId) throw new Error("Could not create Stripe customer");

  const pm = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" },
  });
  await stripe.paymentMethods.attach(pm.id, { customer: stripeCustomerId });

  const session = {
    customerId: job.customerId,
    organizationId: org.id,
    businessSlug: TEST_SLUG,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };

  const result = await payPortalPaymentWithSavedCard(session, job.paymentRecord.id, pm.id);
  if (!result.ok) throw new Error(result.error);

  const updated = await prisma.paymentRecord.findUnique({ where: { id: job.paymentRecord.id } });
  if (updated?.status !== "paid") throw new Error(`Expected paid, got ${updated?.status}`);

  console.log("✓ Paid with saved card via portal PaymentIntent");
  console.log("\n✅ Portal saved-card smoke passed");
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

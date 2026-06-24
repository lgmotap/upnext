/**
 * Stripe payment smoke: Connect → checkout session → signed webhook → paid.
 * Requires: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, Next.js dev on :3000
 * Optional: `npm run stripe:listen` for live Stripe → local forwarding during manual UI tests.
 * Run: npm run smoke:stripe
 */
import { config } from "dotenv";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const TEST_SLUG = "smoke-test-co";
/** Known test Express account — destination charges work before onboarding completes. */
const SMOKE_CONNECT_ACCOUNT_ID = "acct_1TlczsRAIBDcdZbR";

async function postSignedWebhook(
  stripe: import("stripe").default,
  event: Record<string, unknown>,
): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET missing");

  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({ payload, secret });
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

  return fetch(`${base}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": signature },
    body: payload,
  });
}

async function main() {
  const { prisma } = await import("../lib/db/prisma");
  const { getStripe, isStripeConfigured } = await import("../lib/stripe/client");
  const { createJobCheckoutSession } = await import("../server/services/payments");

  if (!isStripeConfigured()) {
    throw new Error("STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be set");
  }

  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe client unavailable");

  console.log("▶ Stripe payment smoke test\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
  });
  if (!org) {
    throw new Error(`Run npm run smoke:e2e first — org with slug ${TEST_SLUG} not found`);
  }

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      stripeConnectAccountId: SMOKE_CONNECT_ACCOUNT_ID,
      stripeConnectChargesEnabled: true,
    },
  });
  console.log(`✓ Linked Connect account ${SMOKE_CONNECT_ACCOUNT_ID}`);

  const job = await prisma.job.findFirst({
    where: { organizationId: org.id, status: "scheduled" },
    include: { paymentRecord: true },
    orderBy: { createdAt: "desc" },
  });
  if (!job?.paymentRecord) {
    throw new Error("No scheduled job with payment record — run npm run smoke:e2e first");
  }

  if (job.paymentRecord.status === "paid") {
    await prisma.paymentRecord.update({
      where: { id: job.paymentRecord.id },
      data: {
        status: "not_requested",
        provider: "manual",
        paidAt: null,
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        paymentUrl: null,
      },
    });
    console.log("✓ Reset payment record for retest");
  }

  const checkout = await createJobCheckoutSession(org.id, job.id);
  if (!checkout.ok || !checkout.url) {
    throw new Error(`Checkout session failed: ${checkout.error ?? "no url"}`);
  }
  console.log("✓ Created Checkout session (destination charge)");

  const payment = await prisma.paymentRecord.findUnique({ where: { id: checkout.paymentRecordId } });
  const sessionId = payment?.stripeCheckoutSessionId;
  if (!sessionId) throw new Error("Missing stripeCheckoutSessionId on payment record");

  const eventId = `evt_smoke_${Date.now()}`;
  const response = await postSignedWebhook(stripe, {
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        payment_status: "paid",
        payment_intent: `pi_smoke_${Date.now()}`,
        metadata: {
          organizationId: org.id,
          jobId: job.id,
          paymentRecordId: checkout.paymentRecordId,
          stripeConnectAccountId: SMOKE_CONNECT_ACCOUNT_ID,
        },
      },
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Webhook POST failed (${response.status}): ${body}`);
  }
  console.log("✓ Webhook route accepted signed checkout.session.completed");

  const updated = await prisma.paymentRecord.findUnique({ where: { id: checkout.paymentRecordId } });
  if (updated?.status !== "paid" || updated.provider !== "stripe") {
    throw new Error(`Expected paid/stripe, got ${updated?.status}/${updated?.provider}`);
  }

  const event = await prisma.stripeWebhookEvent.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Webhook event not recorded in DB");

  console.log(`✓ Payment status: paid via stripe (${event.id})`);
  console.log("\n✓ Stripe payment smoke test passed");
  console.log("  Manual UI test: npm run stripe:listen + pay checkout URL with 4242…");
}

main().catch((e) => {
  console.error("\n✗ Stripe smoke FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});

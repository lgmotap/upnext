import { prisma } from "@/lib/db/prisma";
import { appBaseUrl, getStripe, isStripeConfigured } from "@/lib/stripe/client";
import {
  getOrgStripeConnect,
  getPaymentRecordForJob,
  markWebhookEventProcessed,
  wasWebhookEventProcessed,
} from "@/server/repositories/payments";
import { markPaymentPaidFromStripe } from "@/server/services/portal-payments";
import { notifyPaymentRequest } from "@/server/services/notifications";
import { captureServerEvent } from "@/lib/posthog/server";
import { AnalyticsEvents } from "@/lib/posthog/events";
import { emitOrgWebhook } from "@/server/services/webhooks";
import { getJobForOrg } from "@/server/repositories/jobs";
import type { PaymentStatus } from "@/generated/prisma/client";
import type Stripe from "stripe";

export async function syncStripeConnectStatus(organizationId: string) {
  const stripe = getStripe();
  if (!stripe) return { ok: false as const, error: "Stripe is not configured" };

  const org = await getOrgStripeConnect(organizationId);
  if (!org?.stripeConnectAccountId) {
    return { ok: true as const, chargesEnabled: false };
  }

  const account = await stripe.accounts.retrieve(org.stripeConnectAccountId);
  const chargesEnabled = Boolean(account.charges_enabled);

  await prisma.organization.update({
    where: { id: organizationId },
    data: { stripeConnectChargesEnabled: chargesEnabled },
  });

  return { ok: true as const, chargesEnabled };
}

export async function createStripeConnectOnboardingLink(organizationId: string, ownerEmail: string) {
  const stripe = getStripe();
  if (!stripe) return { ok: false as const, error: "Stripe is not configured on the server" };

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stripeConnectAccountId: true, name: true },
  });
  if (!org) return { ok: false as const, error: "Organization not found" };

  let accountId = org.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      email: ownerEmail,
      business_profile: { name: org.name },
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { organizationId },
    });
    accountId = account.id;
    await prisma.organization.update({
      where: { id: organizationId },
      data: { stripeConnectAccountId: accountId },
    });
  }

  const base = appBaseUrl();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${base}/app/settings/billing?stripe=refresh`,
    return_url: `${base}/app/settings/billing?stripe=return`,
    type: "account_onboarding",
  });

  return { ok: true as const, url: link.url };
}

export async function createJobCheckoutSession(organizationId: string, jobId: string) {
  const stripe = getStripe();
  if (!stripe) return { ok: false as const, error: "Stripe is not configured" };

  const job = await getJobForOrg(organizationId, jobId);
  if (!job) return { ok: false as const, error: "Job not found" };

  const org = await getOrgStripeConnect(organizationId);
  if (!org?.stripeConnectAccountId || !org.stripeConnectChargesEnabled) {
    return { ok: false as const, error: "Connect Stripe in Settings → Billing before sending payment links" };
  }

  let payment = await getPaymentRecordForJob(organizationId, jobId);
  if (!payment) {
    payment = await prisma.paymentRecord.create({
      data: {
        organizationId,
        jobId,
        customerId: job.customerId,
        amountCents: job.priceCents,
        currency: job.currency,
        status: "not_requested",
        provider: "manual",
      },
    });
  }

  if (payment.status === "paid") {
    return { ok: false as const, error: "This job is already marked as paid" };
  }

  const base = appBaseUrl();
  // Destination charge on platform account so checkout.session.completed hits our platform webhook.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: job.customer.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: job.currency.toLowerCase(),
          unit_amount: job.priceCents,
          product_data: { name: job.title },
        },
      },
    ],
    payment_intent_data: {
      transfer_data: {
        destination: org.stripeConnectAccountId,
      },
    },
    metadata: {
      organizationId,
      jobId,
      paymentRecordId: payment.id,
      stripeConnectAccountId: org.stripeConnectAccountId,
    },
    success_url: `${base}/app/jobs/${jobId}?payment=success`,
    cancel_url: `${base}/app/jobs/${jobId}?payment=cancelled`,
  });

  await prisma.paymentRecord.update({
    where: { id: payment.id },
    data: {
      status: "pending",
      provider: "stripe",
      stripeCheckoutSessionId: session.id,
      paymentUrl: session.url,
      dueAt: payment.dueAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await notifyPaymentRequest(organizationId, jobId, session.url ?? null);

  captureServerEvent(organizationId, AnalyticsEvents.paymentLinkSent, {
    jobId,
    paymentRecordId: payment.id,
  });

  return { ok: true as const, url: session.url ?? null, paymentRecordId: payment.id };
}

export async function markPaymentStatusManual(
  organizationId: string,
  jobId: string,
  status: Extract<PaymentStatus, "paid" | "overdue" | "pending">,
) {
  const payment = await getPaymentRecordForJob(organizationId, jobId);
  if (!payment) return { ok: false as const, error: "Payment record not found" };

  await prisma.paymentRecord.update({
    where: { id: payment.id },
    data: {
      status,
      provider: "manual",
      ...(status === "paid" ? { paidAt: new Date(), paymentUrl: null } : {}),
    },
  });

  if (status === "paid") {
    emitOrgWebhook(organizationId, "payment_paid", {
      paymentRecordId: payment.id,
      jobId: payment.jobId,
      customerId: payment.customerId,
      amountCents: payment.amountCents,
      currency: payment.currency,
      provider: "manual",
    });
  }

  return { ok: true as const };
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  const existing = await wasWebhookEventProcessed(event.id);
  if (existing) return { ok: true as const, duplicate: true };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentRecordId = session.metadata?.paymentRecordId;
    const organizationId = session.metadata?.organizationId;

    if (paymentRecordId && session.payment_status === "paid") {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (paymentIntentId && organizationId) {
        await markPaymentPaidFromStripe(paymentRecordId, organizationId, paymentIntentId);
      } else {
        await prisma.paymentRecord.updateMany({
          where: { id: paymentRecordId, organizationId: organizationId ?? undefined },
          data: {
            status: "paid",
            provider: "stripe",
            paidAt: new Date(),
            stripePaymentIntentId: paymentIntentId,
          },
        });
      }
    }

    await markWebhookEventProcessed(event.id, event.type, organizationId);
    return { ok: true as const };
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const paymentRecordId = intent.metadata?.paymentRecordId;
    const organizationId = intent.metadata?.organizationId;

    if (paymentRecordId && organizationId) {
      await markPaymentPaidFromStripe(paymentRecordId, organizationId, intent.id);
    }

    await markWebhookEventProcessed(event.id, event.type, organizationId);
    return { ok: true as const };
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const organizationId = account.metadata?.organizationId;
    if (organizationId) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { stripeConnectChargesEnabled: Boolean(account.charges_enabled) },
      });
    }
    await markWebhookEventProcessed(event.id, event.type, organizationId);
    return { ok: true as const };
  }

  await markWebhookEventProcessed(event.id, event.type);
  return { ok: true as const, ignored: true };
}

export { isStripeConfigured };

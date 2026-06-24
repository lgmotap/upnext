import { prisma } from "@/lib/db/prisma";
import { appBaseUrl, getStripe } from "@/lib/stripe/client";
import { getOrgStripeConnect } from "@/server/repositories/payments";
import type { PortalSession } from "@/lib/portal/session";
import type { SavedPaymentMethod } from "@/lib/portal/saved-payment-methods";

export type { SavedPaymentMethod };

export async function getOrCreateStripeCustomer(organizationId: string, customerId: string) {
  const stripe = getStripe();
  if (!stripe) return null;

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId },
  });
  if (!customer) return null;

  if (customer.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(customer.stripeCustomerId);
      if (!existing.deleted) return customer.stripeCustomerId;
    } catch {
      // fall through to recreate
    }
  }

  const created = await stripe.customers.create({
    email: customer.email,
    name: `${customer.firstName} ${customer.lastName}`.trim(),
    metadata: { organizationId, customerId },
  });

  await prisma.customer.update({
    where: { id: customerId },
    data: { stripeCustomerId: created.id },
  });

  return created.id;
}

export async function listSavedPaymentMethods(
  organizationId: string,
  customerId: string,
): Promise<SavedPaymentMethod[]> {
  const stripe = getStripe();
  if (!stripe) return [];

  const stripeCustomerId = await getOrCreateStripeCustomer(organizationId, customerId);
  if (!stripeCustomerId) return [];

  const methods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: "card",
  });

  return methods.data.map((pm) => ({
    id: pm.id,
    brand: pm.card?.brand ?? "card",
    last4: pm.card?.last4 ?? "????",
    expMonth: pm.card?.exp_month ?? 0,
    expYear: pm.card?.exp_year ?? 0,
  }));
}

export async function createSaveCardCheckoutSession(session: PortalSession) {
  const stripe = getStripe();
  if (!stripe) return { ok: false as const, error: "Online payments are not configured." };

  const org = await getOrgStripeConnect(session.organizationId);
  if (!org?.stripeConnectAccountId || !org.stripeConnectChargesEnabled) {
    return { ok: false as const, error: "This business has not enabled online payments yet." };
  }

  const stripeCustomerId = await getOrCreateStripeCustomer(session.organizationId, session.customerId);
  if (!stripeCustomerId) return { ok: false as const, error: "Customer not found." };

  const base = appBaseUrl();
  const checkout = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    success_url: `${base}/my/${session.businessSlug}/dashboard?tab=payments&card=added`,
    cancel_url: `${base}/my/${session.businessSlug}/dashboard?tab=payments&card=cancelled`,
    metadata: {
      organizationId: session.organizationId,
      customerId: session.customerId,
      source: "customer_portal_setup",
    },
  });

  if (!checkout.url) return { ok: false as const, error: "Could not start card setup." };
  return { ok: true as const, url: checkout.url };
}

export async function payPortalPaymentWithSavedCard(
  session: PortalSession,
  paymentRecordId: string,
  paymentMethodId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "Online payments are not configured." };

  const org = await getOrgStripeConnect(session.organizationId);
  if (!org?.stripeConnectAccountId || !org.stripeConnectChargesEnabled) {
    return { ok: false, error: "This business has not enabled online payments yet." };
  }

  const payment = await prisma.paymentRecord.findFirst({
    where: {
      id: paymentRecordId,
      organizationId: session.organizationId,
      customerId: session.customerId,
    },
    include: { job: { select: { id: true, title: true } } },
  });

  if (!payment) return { ok: false, error: "Payment not found." };
  if (payment.status === "paid") return { ok: false, error: "This balance is already paid." };

  const stripeCustomerId = await getOrCreateStripeCustomer(session.organizationId, session.customerId);
  if (!stripeCustomerId) return { ok: false, error: "Customer not found." };

  const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (pm.customer !== stripeCustomerId) {
    return { ok: false, error: "Invalid saved card." };
  }

  try {
    const intent = await stripe.paymentIntents.create({
      amount: payment.amountCents,
      currency: payment.currency.toLowerCase(),
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      transfer_data: { destination: org.stripeConnectAccountId },
      metadata: {
        organizationId: session.organizationId,
        jobId: payment.jobId,
        paymentRecordId: payment.id,
        stripeConnectAccountId: org.stripeConnectAccountId,
        source: "customer_portal_saved_card",
      },
    });

    if (intent.status === "succeeded") {
      await markPaymentPaidFromStripe(payment.id, session.organizationId, intent.id);
      return { ok: true };
    }

    if (intent.status === "requires_action") {
      return {
        ok: false,
        error: "Your bank requires extra verification. Use the Pay now link instead.",
      };
    }

    return { ok: false, error: "Payment could not be completed. Try another card or contact the business." };
  } catch (err) {
    const message =
      err instanceof Error && "message" in err
        ? err.message
        : "Payment failed. Try another card or use Pay now.";
    return { ok: false, error: message };
  }
}

export async function markPaymentPaidFromStripe(
  paymentRecordId: string,
  organizationId: string,
  stripePaymentIntentId: string,
) {
  await prisma.paymentRecord.updateMany({
    where: { id: paymentRecordId, organizationId },
    data: {
      status: "paid",
      provider: "stripe",
      paidAt: new Date(),
      stripePaymentIntentId,
      paymentUrl: null,
    },
  });
}

export async function isPortalStripePaymentsEnabled(organizationId: string) {
  const stripe = getStripe();
  if (!stripe) return false;
  const org = await getOrgStripeConnect(organizationId);
  return Boolean(org?.stripeConnectAccountId && org.stripeConnectChargesEnabled);
}

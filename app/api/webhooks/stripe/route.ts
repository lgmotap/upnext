import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { handleStripeWebhookEvent } from "@/server/services/payments";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: { code: "NOT_CONFIGURED", message: "Stripe webhook is not configured." } },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: { code: "MISSING_SIGNATURE" } }, { status: 400 });
  }

  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: { code: "INVALID_SIGNATURE", message } }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: { code: "PROCESSING_FAILED" } }, { status: 500 });
  }
}

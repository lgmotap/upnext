import { NextResponse } from "next/server";

/**
 * Stripe webhook endpoint — STUB.
 * Implemented in Sprint 06 (docs/12-payments-and-billing.md):
 * verify signature, parse event, update PaymentRecord/Subscription, idempotent, logged.
 */
export async function POST() {
  return NextResponse.json(
    { error: { code: "NOT_IMPLEMENTED", message: "Stripe webhook handler is not wired up yet." } },
    { status: 501 },
  );
}

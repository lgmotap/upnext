import Stripe from "stripe";

let _stripe: Stripe | null | undefined;

const PLACEHOLDER = /^(placeholder|changeme|your_|xxx|todo|replace_me)/i;

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  return key.length >= 12 && !PLACEHOLDER.test(key);
}

/** Server-only Stripe client. Returns null when STRIPE_SECRET_KEY is unset. */
export function getStripe(): Stripe | null {
  if (_stripe !== undefined) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || !isStripeConfigured()) {
    _stripe = null;
    return null;
  }

  _stripe = new Stripe(key, { typescript: true });
  return _stripe;
}

export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

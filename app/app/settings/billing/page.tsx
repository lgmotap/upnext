import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, CreditCard, ExternalLink } from "lucide-react";
import { Card, CardHeader } from "@/components/app/ui";
import { getAppSession } from "@/server/permissions/session";
import { canManageBilling } from "@/server/permissions/can";
import { getOrgStripeConnect } from "@/server/repositories/payments";
import { isStripeConfigured, syncStripeConnectStatus } from "@/server/services/payments";
import { startStripeConnectAction, syncStripeConnectAction } from "@/server/actions/payments";

const plans = [
  {
    name: "Solo",
    price: "$19",
    blurb: "One operator",
    features: ["1 team seat", "Online booking", "Jobs & calendar", "Payment tracking"],
    current: false,
  },
  {
    name: "Team",
    price: "$49",
    blurb: "Small crews",
    features: ["Up to 10 seats", "Crew mobile view", "Assignments & roles", "Email reminders"],
    current: true,
  },
  {
    name: "Business",
    price: "$99",
    blurb: "Growing teams",
    features: ["Unlimited seats", "Advanced reporting", "Priority support", "Integrations"],
    current: false,
  },
];

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string; error?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/settings/billing");

  const params = await searchParams;
  const canBilling = canManageBilling(session);
  const stripeReady = isStripeConfigured();

  if (params.stripe === "return" && canBilling) {
    await syncStripeConnectStatus(session.organizationId);
  }

  const connect = await getOrgStripeConnect(session.organizationId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Customer payments (Stripe Connect)"
          action={
            canBilling && stripeReady && connect?.stripeConnectAccountId ? (
              <form action={syncStripeConnectAction}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 transition hover:bg-ink-100"
                >
                  Refresh status
                </button>
              </form>
            ) : undefined
          }
        />
        <div className="space-y-4 p-5">
          {!stripeReady && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
              Add <code className="rounded bg-white/80 px-1">STRIPE_SECRET_KEY</code> to your environment to
              enable payment links. Manual mark-paid still works without Stripe.
            </p>
          )}

          {params.error && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
              {decodeURIComponent(params.error)}
            </p>
          )}

          {params.stripe === "return" && connect?.stripeConnectChargesEnabled && (
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900 ring-1 ring-brand-100">
              Stripe Connect is ready — you can send payment links from job pages.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink-950">
                <CreditCard className="size-4 text-ink-400" />
                {connect?.stripeConnectChargesEnabled
                  ? "Connected — ready to accept payments"
                  : connect?.stripeConnectAccountId
                    ? "Connect setup in progress"
                    : "Not connected"}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                Separate from UpNext subscription billing. Customers pay your business via Stripe Checkout.
              </p>
            </div>
            {canBilling && stripeReady && (
              <form action={startStripeConnectAction}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-400 px-4 py-2 text-sm font-semibold text-brand-950 transition hover:bg-brand-300"
                >
                  {connect?.stripeConnectAccountId ? "Continue Stripe setup" : "Connect Stripe"}
                  <ExternalLink className="size-4" />
                </button>
              </form>
            )}
          </div>

          {!canBilling && (
            <p className="text-xs text-ink-400">Only the organization owner can manage Stripe Connect.</p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="UpNext subscription" />
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-lg font-bold text-ink-950">Team — $49 / month</p>
            <p className="text-sm text-ink-500">Early access — SaaS billing coming soon</p>
          </div>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800">Active</span>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={`p-5 ${p.current ? "ring-2 ring-brand-400" : ""}`}>
            <p className="text-sm font-semibold text-ink-500">{p.name}</p>
            <p className="mt-1 text-3xl font-bold text-ink-950">
              {p.price}
              <span className="text-sm font-medium text-ink-400">/mo</span>
            </p>
            <p className="text-xs text-ink-500">{p.blurb}</p>
            <ul className="mt-4 space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-ink-700">
                  <Check className="size-4 text-brand-600" /> {f}
                </li>
              ))}
            </ul>
            <button
              className={`mt-4 w-full rounded-full py-2 text-sm font-bold ${
                p.current ? "bg-ink-100 text-ink-500" : "bg-brand-400 text-brand-950 hover:bg-brand-300"
              }`}
              disabled={p.current}
              type="button"
            >
              {p.current ? "Current plan" : `Switch to ${p.name}`}
            </button>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-ink-400">
        Need help with payouts? See{" "}
        <Link href="/app/payments" className="font-semibold text-brand-700 hover:underline">
          Payments
        </Link>
        .
      </p>
    </div>
  );
}

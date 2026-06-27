"use client";

import { CreditCard, Plus } from "lucide-react";
import { formatMoney } from "@/lib/money/format";
import { addPortalCardAction, payWithSavedCardAction } from "@/server/actions/customer-portal";
import type { SavedPaymentMethod } from "@/lib/portal/saved-payment-methods";

type PortalPayment = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentUrl: string | null;
  job: { id: string; title: string; scheduledStartAt: Date | string; status: string };
};

function formatWhen(iso: Date | string) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function cardLabel(pm: SavedPaymentMethod) {
  const brand = pm.brand.charAt(0).toUpperCase() + pm.brand.slice(1);
  return `${brand} ···· ${pm.last4}`;
}

export function PortalPaymentsPanel({
  businessSlug,
  payments,
  savedPaymentMethods,
  stripePaymentsEnabled,
}: {
  businessSlug: string;
  payments: PortalPayment[];
  savedPaymentMethods: SavedPaymentMethod[];
  stripePaymentsEnabled: boolean;
}) {
  const defaultPmId = savedPaymentMethods[0]?.id ?? "";

  return (
    <div className="space-y-4">
      {stripePaymentsEnabled && (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-100">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
            <h2 className="text-sm font-bold text-ink-950">Saved cards</h2>
            <form action={addPortalCardAction}>
              <input type="hidden" name="businessSlug" value={businessSlug} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink-800"
              >
                <Plus className="size-3.5" /> Add card
              </button>
            </form>
          </div>
          {savedPaymentMethods.length === 0 ? (
            <p className="p-4 text-sm text-ink-500">
              Save a card for faster checkout on future visits. You&apos;ll be redirected to Stripe to
              enter card details securely.
            </p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {savedPaymentMethods.map((pm) => (
                <li key={pm.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <CreditCard className="size-4 text-ink-400" />
                  <span className="font-medium text-ink-900">{cardLabel(pm)}</span>
                  <span className="text-ink-500">
                    {pm.expMonth}/{String(pm.expYear).slice(-2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-100">
        <div className="border-b border-ink-100 px-4 py-3">
          <h2 className="text-sm font-bold text-ink-950">Outstanding balances</h2>
        </div>
        {payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-500">No outstanding payments.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {payments.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-950">{p.job.title}</p>
                    <p className="text-sm text-ink-500">{formatWhen(p.job.scheduledStartAt)}</p>
                  </div>
                  <p className="font-bold text-ink-950">{formatMoney(p.amountCents, p.currency)}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {stripePaymentsEnabled && savedPaymentMethods.length > 0 && (
                    <form action={payWithSavedCardAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="businessSlug" value={businessSlug} />
                      <input type="hidden" name="paymentRecordId" value={p.id} />
                      <select
                        name="paymentMethodId"
                        defaultValue={defaultPmId}
                        className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-xs font-medium text-ink-800"
                      >
                        {savedPaymentMethods.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {cardLabel(pm)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-brand-400 px-3 py-1.5 text-xs font-bold text-brand-950 hover:bg-brand-600"
                      >
                        Pay with saved card
                      </button>
                    </form>
                  )}
                  {p.paymentUrl ? (
                    <a
                      href={p.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      Pay now (checkout link)
                    </a>
                  ) : (
                    <p className="text-xs text-ink-400">Awaiting payment link from business</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

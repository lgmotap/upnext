"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import type { BookingPrefillDetails } from "@/lib/portal/prefill-token";
import { cancelPortalBookingAction, portalLogoutAction } from "@/server/actions/customer-portal";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { PortalPaymentsPanel } from "@/components/portal/PortalPaymentsPanel";
import { PortalFaqAccordion } from "@/components/portal/PortalFaqAccordion";
import { PortalRescheduleModal } from "@/components/portal/PortalRescheduleModal";
import { PortalCleaningPlanSidebar } from "@/components/portal/PortalCleaningPlanSidebar";
import { PublicServiceCard } from "@/components/booking/PublicServiceCard";
import type { PortalFaqItem } from "@/lib/portal/faq";
import type { SavedPaymentMethod } from "@/lib/portal/saved-payment-methods";

type PortalService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  basePriceCents: number;
  currency: string;
  iconKey: string | null;
};

type PortalBooking = {
  id: string;
  status: string;
  requestedStartAt: Date | string;
  canCancel?: boolean;
  canReschedule?: boolean;
  service: { name: string };
  addons: { name: string }[];
  job: {
    id: string;
    status: string;
    customerAddress: {
      line1: string;
      city: string;
      region: string;
      postalCode: string;
    } | null;
  } | null;
};

type PortalPayment = {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentUrl: string | null;
  job: { id: string; title: string; scheduledStartAt: Date | string; status: string };
};

const tabs = ["history", "book", "payments"] as const;
type Tab = (typeof tabs)[number];

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

function statusLabel(status: string, jobStatus?: string) {
  if (status === "pending") return "Pending";
  if (status === "accepted") return jobStatus === "in_progress" ? "In progress" : "Confirmed";
  if (status === "declined") return "Declined";
  if (status === "cancelled") return "Cancelled";
  return status;
}

export function CustomerPortalDashboard({
  businessSlug,
  businessName,
  customerName,
  bookings,
  payments,
  bookAgainUrl,
  prefill,
  primaryServices = [],
  faq = [],
  stripePaymentsEnabled = false,
  savedPaymentMethods = [],
  initialTab = "history",
  flash,
  cleaningPlan = null,
}: {
  businessSlug: string;
  businessName: string;
  customerName: string;
  bookings: PortalBooking[];
  payments: PortalPayment[];
  bookAgainUrl: string;
  prefill: BookingPrefillDetails;
  primaryServices?: PortalService[];
  faq?: PortalFaqItem[];
  stripePaymentsEnabled?: boolean;
  savedPaymentMethods?: SavedPaymentMethod[];
  initialTab?: Tab;
  flash?: { error?: string; cancelled?: boolean; rescheduled?: boolean; cardAdded?: boolean; paid?: boolean };
  cleaningPlan?: {
    serviceName: string;
    addonNames: string[];
    frequency: string;
    addressLine: string;
    nextVisitAt: Date | string | null;
  } | null;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Customer portal</p>
            <h1 className="truncate text-lg font-bold text-ink-950">{businessName}</h1>
            <p className="truncate text-sm text-ink-500">{customerName}</p>
          </div>
          <form action={portalLogoutAction}>
            <input type="hidden" name="businessSlug" value={businessSlug} />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink-600 ring-1 ring-ink-200 hover:ring-brand-400"
            >
              <LogOut className="size-3.5" /> Log out
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 px-4 pb-0">
          {(
            [
              ["history", "Booking history"],
              ["book", "Book again"],
              ["payments", "Payments"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold ${
                tab === id
                  ? "border-b-2 border-brand-500 text-ink-950"
                  : "text-ink-500 hover:text-ink-900"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {flash?.error && (
          <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{flash.error}</p>
        )}
        {flash?.rescheduled && (
          <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900">
            Your booking was rescheduled. You&apos;ll receive a confirmation email.
          </p>
        )}
        {flash?.cancelled && (
          <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900">
            Your booking was cancelled.
          </p>
        )}
        {flash?.cardAdded && (
          <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900">
            Card saved successfully.
          </p>
        )}
        {flash?.paid && (
          <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900">
            Payment received — thank you!
          </p>
        )}

        {tab === "history" && (
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-100">
            {bookings.length === 0 ? (
              <p className="p-8 text-center text-sm text-ink-500">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-ink-100">
                {bookings.map((b) => {
                  const addr = b.job?.customerAddress;
                  const addressLine = addr
                    ? `${addr.line1}, ${addr.city}, ${addr.region} ${addr.postalCode}`
                    : "—";
                  const services = [b.service.name, ...b.addons.map((a) => a.name)].join(", ");
                  const canCancel = b.canCancel ?? false;
                  const canReschedule = b.canReschedule ?? false;

                  return (
                    <li key={b.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-950">{formatWhen(b.requestedStartAt)}</p>
                          <p className="mt-0.5 text-sm text-ink-600">{addressLine}</p>
                          <p className="mt-1 text-sm text-ink-500">{services}</p>
                        </div>
                        <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-bold text-ink-700">
                          {statusLabel(b.status, b.job?.status)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Link
                          href={bookAgainUrl}
                          className="text-xs font-semibold text-brand-700 hover:underline"
                        >
                          Book again
                        </Link>
                        {canReschedule && (
                          <button
                            type="button"
                            onClick={() => setRescheduleId(b.id)}
                            className="text-xs font-semibold text-brand-700 hover:underline"
                          >
                            Reschedule
                          </button>
                        )}
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setCancelId(b.id)}
                            className="text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Cancel booking
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {tab === "book" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,280px)]">
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-6 ring-1 ring-ink-100">
                <h2 className="text-lg font-bold text-ink-950">Book a service</h2>
                <p className="mt-1 text-sm text-ink-500">
                  Choose a service below. Your contact details and address will be prefilled on the
                  booking form.
                </p>
                {primaryServices.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-500">No services are available to book right now.</p>
                ) : (
                  <div className="mt-4 grid gap-2.5">
                    {primaryServices.map((s) => (
                      <PublicServiceCard
                        key={s.id}
                        name={s.name}
                        description={s.description}
                        durationMinutes={s.durationMinutes}
                        basePriceCents={s.basePriceCents}
                        currency={s.currency}
                        iconKey={s.iconKey}
                        href={`${bookAgainUrl}&serviceId=${encodeURIComponent(s.id)}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-ink-50 p-5 ring-1 ring-ink-100">
                <h3 className="text-sm font-bold text-ink-950">Your saved details</h3>
                <dl className="mt-3 space-y-2 text-sm text-ink-700">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-ink-400">Contact</dt>
                    <dd>
                      {prefill.firstName} {prefill.lastName} · {prefill.email}
                      {prefill.phone ? ` · ${prefill.phone}` : ""}
                    </dd>
                  </div>
                  {prefill.line1 && (
                    <div>
                      <dt className="text-xs font-semibold uppercase text-ink-400">Address</dt>
                      <dd>
                        {prefill.line1}
                        {prefill.line2 ? `, ${prefill.line2}` : ""}, {prefill.city}, {prefill.region}{" "}
                        {prefill.postalCode}
                      </dd>
                    </div>
                  )}
                </dl>
                <Link
                  href={bookAgainUrl}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                >
                  Open full booking form <ExternalLink className="size-4" />
                </Link>
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <PortalCleaningPlanSidebar plan={cleaningPlan} />
              <PortalFaqAccordion items={faq} />
            </aside>
          </div>
        )}

        {tab === "payments" && (
          <PortalPaymentsPanel
            businessSlug={businessSlug}
            payments={payments}
            savedPaymentMethods={savedPaymentMethods}
            stripePaymentsEnabled={stripePaymentsEnabled}
          />
        )}
      </main>

      <PortalRescheduleModal
        open={Boolean(rescheduleId)}
        onClose={() => setRescheduleId(null)}
        bookingRequestId={rescheduleId ?? ""}
        businessSlug={businessSlug}
      />

      <ConfirmDialog
        open={Boolean(cancelId)}
        onClose={() => setCancelId(null)}
        title="Cancel this booking?"
        description="The business will be notified. This cannot be undone."
        confirmLabel="Cancel booking"
        tone="danger"
        formAction={cancelPortalBookingAction}
        hiddenFields={
          cancelId
            ? { bookingRequestId: cancelId, businessSlug }
            : undefined
        }
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { Check, Mail, Clock } from "lucide-react";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { formatMoney } from "@/lib/money/format";
import { getPublicBookingRequest } from "@/server/repositories/bookings";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ businessSlug: string; bookingRequestId: string }>;
}) {
  const { businessSlug, bookingRequestId } = await params;
  const booking = await getPublicBookingRequest(businessSlug, bookingRequestId);

  if (!booking) notFound();

  const businessName = booking.organization.businessProfile?.displayName ?? "Your provider";
  const when = formatDisplayDateTime(booking.requestedStartAt, booking.organization.timezone);
  const addonTotal = (booking.addons ?? []).reduce((s, a) => s + a.priceCents, 0);
  const totalCents = booking.service.basePriceCents + addonTotal;
  const serviceLabel =
    booking.addons && booking.addons.length > 0
      ? `${booking.service.name} + ${booking.addons.map((a) => a.name).join(", ")}`
      : booking.service.name;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-ink-900">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-brand-400 text-brand-950">
          <Check className="size-8" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-950">Request sent!</h1>
        <p className="mt-2 text-ink-600">
          {businessName} will confirm your booking shortly. A confirmation email is on its way.
        </p>

        <div className="mt-6 space-y-2.5 rounded-3xl bg-white p-5 text-left ring-1 ring-ink-100 shadow-soft">
          <Row icon={Clock} label="Requested" value={when} />
          <Row
            icon={Check}
            label="Service"
            value={`${serviceLabel} · ${formatMoney(totalCents, booking.service.currency)}`}
          />
          <Row icon={Mail} label="Confirmation to" value={booking.customer.email} />
        </div>

        <p className="mt-6 text-xs text-ink-400">
          Reference <span className="font-mono text-ink-500">{booking.id}</span> · Powered by{" "}
          <span className="font-semibold text-ink-600">UpNext</span>
        </p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="text-sm font-semibold text-ink-900">{value}</p>
      </div>
    </div>
  );
}

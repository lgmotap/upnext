import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Mail, Clock, Repeat, Phone, ExternalLink } from "lucide-react";
import { AddToCalendarButton } from "@/components/booking/AddToCalendarButton";
import { frequencyLabel } from "@/lib/booking/frequency";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { buildCalendarLinks } from "@/lib/datetime/calendar-links";
import { formatMoney } from "@/lib/money/format";
import { getCustomerPortalUrl } from "@/lib/url/app";
import { isCustomerPortalEnabled } from "@/lib/portal/enabled";
import { getPublicBookingRequest } from "@/server/repositories/bookings";
import { site } from "@/lib/config";

export default async function BookingConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessSlug: string; bookingRequestId: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { businessSlug, bookingRequestId } = await params;
  const query = await searchParams;
  const paidAtBooking = query.payment === "success";
  const booking = await getPublicBookingRequest(businessSlug, bookingRequestId);

  if (!booking) notFound();

  const profile = booking.organization.businessProfile;
  const businessName = profile?.displayName ?? "Your provider";
  const when = formatDisplayDateTime(booking.requestedStartAt, booking.organization.timezone);
  const addonTotal = (booking.addons ?? []).reduce((s, a) => s + a.priceCents, 0);
  const totalCents = booking.service.basePriceCents + addonTotal;
  const serviceLabel =
    booking.addons && booking.addons.length > 0
      ? `${booking.service.name} + ${booking.addons.map((a) => a.name).join(", ")}`
      : booking.service.name;

  const address = booking.customer.addresses?.[0];
  const location = address
    ? `${address.line1}, ${address.city}, ${address.region} ${address.postalCode}`
    : "";

  const calendarLinks = buildCalendarLinks({
    uid: booking.id,
    title: `${serviceLabel} — ${businessName}`,
    description: `Booking request with ${businessName}. Reference: ${booking.id}`,
    location,
    startAt: booking.requestedStartAt,
    endAt: booking.requestedEndAt,
  });

  const portalUrl =
    profile && isCustomerPortalEnabled(profile) && profile.publicSlug
      ? getCustomerPortalUrl(profile.publicSlug)
      : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-ink-900">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-brand-400 text-brand-950">
          <Check className="size-8" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-950">
          {paidAtBooking ? "Payment received!" : "Request sent!"}
        </h1>
        <p className="mt-2 text-ink-600">
          {paidAtBooking
            ? `${businessName} has your payment and will confirm your booking shortly.`
            : `${businessName} will confirm your booking shortly. A confirmation email is on its way.`}
        </p>

        <div className="mt-6 space-y-2.5 rounded-3xl bg-white p-5 text-left ring-1 ring-ink-100 shadow-soft">
          <Row icon={Clock} label="Requested" value={when} />
          <Row icon={Check} label="Service" value={`${serviceLabel} · ${formatMoney(totalCents, booking.service.currency)}`} />
          {booking.frequency && booking.frequency !== "one_time" && (
            <Row icon={Repeat} label="Frequency" value={frequencyLabel(booking.frequency)} />
          )}
          <Row icon={Mail} label="Confirmation to" value={booking.customer.email} />
          {(profile?.phone || profile?.email) && (
            <Row
              icon={Phone}
              label="Questions?"
              value={[profile.phone, profile.email].filter(Boolean).join(" · ")}
            />
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <AddToCalendarButton whenLabel={when} links={calendarLinks} />
          {portalUrl && (
            <Link
              href={portalUrl}
              className="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-50"
            >
              Manage bookings <ExternalLink className="size-3.5" />
            </Link>
          )}
        </div>

        <p className="mt-6 text-xs text-ink-400">
          Reference <span className="font-mono text-ink-500">{booking.id}</span> · Powered by{" "}
          <span className="font-semibold text-ink-600">{site.name}</span>
        </p>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className="text-sm font-semibold text-ink-900">{value}</p>
      </div>
    </div>
  );
}

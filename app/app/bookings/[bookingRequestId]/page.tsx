import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, X, CalendarClock, MapPin, Clock, Mail, Phone, Briefcase } from "lucide-react";
import { Card, CardHeader, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { formatJobSchedule, formatAddressLine } from "@/lib/datetime/calendar";
import { formatMoney } from "@/lib/money/format";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { getBookingRequestForOrg } from "@/server/repositories/bookings";
import { acceptBookingAction, declineBookingAction } from "@/server/actions/bookings";
import { prisma } from "@/lib/db/prisma";

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookingRequestId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/bookings");

  const { bookingRequestId } = await params;
  const query = await searchParams;

  const booking = await getBookingRequestForOrg(session.organizationId, bookingRequestId);
  if (!booking) notFound();

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";

  const customerName = `${booking.customer.firstName} ${booking.customer.lastName}`;
  const address = booking.customer.addresses[0] ?? null;
  const submitted = formatDisplayDateTime(booking.createdAt, timeZone);
  const schedule = formatJobSchedule(booking.requestedStartAt, booking.requestedEndAt, timeZone);
  const addonTotal = booking.addons.reduce((sum, a) => sum + a.priceCents, 0);
  const priceCents = booking.service.basePriceCents + addonTotal;
  const canRespond = booking.status === "pending" && canManageBookings(session);

  return (
    <>
      <Link
        href="/app/bookings"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="size-4" /> Back to bookings
      </Link>

      {query.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(query.error)}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink-950">{customerName}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-ink-500">Submitted {submitted}</p>
        </div>
        {booking.job && (
          <AppButton href={`/app/jobs/${booking.job.id}`} variant="outline">
            <Briefcase className="size-4" /> View job
          </AppButton>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Request details" />
            <div className="space-y-4 p-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail icon={CalendarClock} label="Requested date" value={schedule.date} />
                <Detail icon={Clock} label="Requested time" value={schedule.time} />
                <Detail icon={Clock} label="Service" value={booking.service.name} />
                <Detail
                  icon={Briefcase}
                  label="Source"
                  value={booking.source === "manual" ? "Manual (owner)" : "Public booking page"}
                />
                <Detail icon={MapPin} label="Address" value={formatAddressLine(address)} />
              </dl>

              {booking.addons.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Add-ons</p>
                  <ul className="space-y-1.5">
                    {booking.addons.map((addon) => (
                      <li
                        key={addon.id}
                        className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm"
                      >
                        <span className="text-ink-800">{addon.name}</span>
                        <span className="font-medium text-ink-600">
                          {formatMoney(addon.priceCents, booking.service.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {booking.customerNotes && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Customer notes</p>
                  <p className="rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700">{booking.customerNotes}</p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <div className="space-y-3 p-5 text-sm">
              <p className="font-semibold text-ink-950">{customerName}</p>
              <p className="flex items-center gap-2 text-ink-600">
                <Mail className="size-4 text-ink-400" />
                <a href={`mailto:${booking.customer.email}`} className="hover:text-brand-700">
                  {booking.customer.email}
                </a>
              </p>
              {booking.customer.phone && (
                <p className="flex items-center gap-2 text-ink-600">
                  <Phone className="size-4 text-ink-400" />
                  <a href={`tel:${booking.customer.phone}`} className="hover:text-brand-700">
                    {booking.customer.phone}
                  </a>
                </p>
              )}
              <AppButton variant="ghost" href={`/app/customers/${booking.customerId}`} className="!px-0">
                Open customer profile
              </AppButton>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Estimate" />
            <div className="p-5">
              <p className="text-3xl font-bold text-ink-950">
                {formatMoney(priceCents, booking.service.currency)}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {booking.service.durationMinutes +
                  booking.addons.reduce((sum, a) => sum + a.durationMinutes, 0)}{" "}
                min total
              </p>
              <p className="mt-2 text-xs text-ink-400">Source: {booking.source.replace(/_/g, " ")}</p>
            </div>
          </Card>

          {canRespond && (
            <Card>
              <CardHeader title="Respond" />
              <div className="space-y-2.5 p-5">
                <form action={acceptBookingAction}>
                  <input type="hidden" name="bookingRequestId" value={booking.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
                  >
                    <Check className="size-4" /> Accept &amp; create job
                  </button>
                </form>
                <form action={declineBookingAction}>
                  <input type="hidden" name="bookingRequestId" value={booking.id} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                  >
                    <X className="size-4" /> Decline
                  </button>
                </form>
                <p className="pt-1 text-center text-xs text-ink-400">
                  Accepting creates a scheduled job and opens it for assignment.
                </p>
              </div>
            </Card>
          )}

          {booking.status === "accepted" && booking.job && (
            <Card>
              <CardHeader title="Next step" />
              <p className="px-5 pb-5 text-sm text-ink-600">
                This request was accepted. Assign a team member and track completion from the job.
              </p>
              <div className="px-5 pb-5">
                <AppButton href={`/app/jobs/${booking.job.id}`} className="w-full justify-center">
                  Open job
                </AppButton>
              </div>
            </Card>
          )}

          {booking.status === "declined" && (
            <Card>
              <CardHeader title="Status" />
              <p className="px-5 pb-5 text-sm text-ink-600">This booking request was declined.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon className="size-3.5" />
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
        <dd className="text-sm font-medium text-ink-900">{value}</dd>
      </div>
    </div>
  );
}

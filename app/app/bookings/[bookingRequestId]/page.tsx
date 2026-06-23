import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, X, CalendarClock, MapPin, Clock } from "lucide-react";
import { Card, CardHeader, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { bookingRequests } from "@/lib/mock/data";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ bookingRequestId: string }>;
}) {
  const { bookingRequestId } = await params;
  const booking = bookingRequests.find((b) => b.id === bookingRequestId);
  if (!booking) notFound();

  return (
    <>
      <Link href="/app/bookings" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft className="size-4" /> Back to bookings
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Booking request" action={<StatusBadge status={booking.status} />} />
          <div className="space-y-4 p-5">
            <div>
              <p className="text-2xl font-bold text-ink-950">{booking.customer}</p>
              <p className="text-sm text-ink-500">Submitted {booking.submitted}</p>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <Detail icon={CalendarClock} label="Requested time" value={booking.requestedAt} />
              <Detail icon={Clock} label="Service" value={booking.service} />
              <Detail icon={MapPin} label="Address" value={booking.address} />
            </dl>
            {booking.notes && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Customer notes</p>
                <p className="rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-700">{booking.notes}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Respond" />
          <div className="space-y-2.5 p-5">
            <button className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300">
              <Check className="size-4" /> Accept &amp; create job
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100">
              <CalendarClock className="size-4" /> Suggest a new time
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50">
              <X className="size-4" /> Decline
            </button>
            <p className="pt-1 text-center text-xs text-ink-400">Accepting converts this into a scheduled job and emails the customer.</p>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-center text-xs text-ink-400">
        UI preview on mock data — wired to <code className="rounded bg-ink-100 px-1">acceptBookingRequest</code> in a later sprint. See{" "}
        <AppButton variant="ghost" href="/app/dashboard" className="!px-1 !py-0 text-xs">dashboard</AppButton>.
      </p>
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

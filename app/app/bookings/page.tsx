import Link from "next/link";
import { Check, X, Clock } from "lucide-react";
import { Card, PageHeader, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { bookingRequests } from "@/lib/mock/data";

export default function BookingsPage() {
  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Review and respond to incoming booking requests."
        action={<AppButton variant="outline" href="/app/calendar">Open calendar</AppButton>}
      />

      <div className="space-y-3">
        {bookingRequests.map((b) => (
          <Card key={b.id} className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/app/bookings/${b.id}`} className="text-base font-bold text-ink-950 hover:text-brand-700">
                    {b.customer}
                  </Link>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-600">
                  <span className="font-medium text-ink-800">{b.service}</span>
                  <span className="inline-flex items-center gap-1 text-ink-500">
                    <Clock className="size-3.5" /> {b.requestedAt}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-400">{b.address}</p>
                {b.notes && <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-600">“{b.notes}”</p>}
              </div>

              {b.status === "pending" && (
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-3.5 py-2 text-sm font-bold text-brand-950 hover:bg-brand-300">
                    <Check className="size-4" /> Accept
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100">
                    <X className="size-4" /> Decline
                  </button>
                </div>
              )}
              <span className="self-center text-xs text-ink-400">{b.submitted}</span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

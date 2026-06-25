import Link from "next/link";
import { Card, CardHeader } from "@/components/app/ui";
import { CopyBookingLink } from "@/components/app/CopyBookingLink";
import { formatMoney } from "@/lib/money/format";
import type { ThirtyDaySnapshot } from "@/lib/reporting/period-stats";

function SnapshotMetricCard({
  label,
  count,
  valueLabel,
}: {
  label: string;
  count: number;
  valueLabel: string;
}) {
  return (
    <div className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink-950">{count}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-600">{valueLabel}</p>
    </div>
  );
}

export function BusinessSnapshot({
  bookingUrl,
  snapshot,
  currency,
  reportsHref,
}: {
  bookingUrl: string;
  snapshot: ThirtyDaySnapshot;
  currency: string;
  reportsHref: string;
}) {
  const empty =
    snapshot.bookingsCreatedCount === 0 &&
    snapshot.jobsScheduledCount === 0 &&
    snapshot.revenueCollectedCents === 0;

  return (
    <Card className="mb-6">
      <CardHeader
        title="Business snapshot"
        action={
          <Link href={reportsHref} className="text-xs font-semibold text-brand-700 hover:underline">
            View reports
          </Link>
        }
      />
      <div className="px-5 pb-5">
        <p className="mb-4 text-sm text-ink-500">Last 30 days at a glance</p>
        {empty ? (
          <div className="rounded-xl bg-ink-50 p-6 text-center">
            <p className="text-sm text-ink-600">No bookings in the last 30 days.</p>
            {bookingUrl && (
              <div className="mt-4 flex justify-center">
                <CopyBookingLink url={bookingUrl} label="Share booking page" />
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <SnapshotMetricCard
              label="Bookings created"
              count={snapshot.bookingsCreatedCount}
              valueLabel={formatMoney(snapshot.bookingsCreatedValueCents, currency)}
            />
            <SnapshotMetricCard
              label="Jobs scheduled"
              count={snapshot.jobsScheduledCount}
              valueLabel={formatMoney(snapshot.jobsScheduledValueCents, currency)}
            />
            <div className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Revenue collected
              </p>
              <p className="mt-1 text-2xl font-bold text-ink-950">
                {formatMoney(snapshot.revenueCollectedCents, currency)}
              </p>
              <div className="mt-3 flex h-16 items-end gap-0.5">
                {snapshot.revenueDailyBars.map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${Math.max(h, 4)}%` }}
                    className="flex-1 rounded-t bg-brand-400/80"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

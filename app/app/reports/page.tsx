import Link from "next/link";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/app/ui";
import { parseReportDateRange } from "@/lib/reports/range";
import { getAppSession } from "@/server/permissions/session";
import { canManageBusiness } from "@/server/permissions/can";
import {
  formatReportingMoney,
  getReportingData,
  getReportingRangeStats,
} from "@/server/services/reporting";
import { prisma } from "@/lib/db/prisma";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; error?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/reports");

  const params = await searchParams;
  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true, currency: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const currency = org?.currency ?? "USD";
  const canExport = canManageBusiness(session);

  const rangeParsed = parseReportDateRange(params.from, params.to, timeZone);
  const rangeError = !rangeParsed.ok ? rangeParsed.error : params.error;

  const [data, rangeStats] = await Promise.all([
    getReportingData(session.organizationId, timeZone, currency),
    rangeParsed.ok
      ? getReportingRangeStats(
          session.organizationId,
          timeZone,
          currency,
          rangeParsed.range.start,
          rangeParsed.range.end,
          rangeParsed.range.label,
          rangeParsed.range.fromYmd,
          rangeParsed.range.toYmd,
        )
      : null,
  ]);

  const maxTrend = Math.max(...data.weeklyTrend.map((w) => w.revenueCents), 1);
  const exportHref =
    rangeParsed.ok && canExport
      ? `/app/reports/export?from=${rangeParsed.range.fromYmd}&to=${rangeParsed.range.toYmd}`
      : null;

  const rangeEmpty =
    rangeStats &&
    rangeStats.revenueCents === 0 &&
    rangeStats.jobsCompleted === 0 &&
    rangeStats.newBookings === 0 &&
    rangeStats.exportRowCount === 0;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Revenue, completed jobs, and outstanding balances."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="All-time revenue" value={formatReportingMoney(data.allTimeRevenueCents, currency)} />
        <StatCard
          label="This week"
          value={formatReportingMoney(data.thisWeek.revenueCents, currency)}
          delta={`${data.thisWeek.jobsCompleted} jobs completed`}
        />
        <StatCard
          label="Outstanding"
          value={formatReportingMoney(data.outstandingCents, currency)}
          trend="down"
        />
        <StatCard
          label="Overdue"
          value={formatReportingMoney(data.overdueCents, currency)}
          trend={data.overdueCents > 0 ? "down" : "up"}
        />
      </div>

      <Card className="mt-4 p-5">
        <CardHeader
          title="Custom date range"
          action={
            exportHref ? (
              <Link
                href={exportHref}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-3.5 py-1.5 text-xs font-bold text-brand-950 hover:bg-brand-300"
              >
                <Download className="size-3.5" />
                Export CSV
              </Link>
            ) : undefined
          }
        />
        {rangeError && (
          <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
            {rangeError}
          </p>
        )}
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="from" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              From
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={rangeParsed.ok ? rangeParsed.range.fromYmd : undefined}
              className="rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-ink-200"
            />
          </div>
          <div>
            <label htmlFor="to" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              To
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={rangeParsed.ok ? rangeParsed.range.toYmd : undefined}
              className="rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-ink-200"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-ink-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Apply
          </button>
        </form>

        {rangeStats && (
          <dl className="mt-5 grid gap-3 border-t border-ink-100 pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-ink-500">Period</dt>
              <dd className="font-semibold text-ink-900">{rangeStats.label}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Revenue (paid)</dt>
              <dd className="font-semibold text-ink-900">
                {formatReportingMoney(rangeStats.revenueCents, currency)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">Jobs completed</dt>
              <dd className="font-semibold text-ink-900">{rangeStats.jobsCompleted}</dd>
            </div>
            <div>
              <dt className="text-ink-500">New bookings</dt>
              <dd className="font-semibold text-ink-900">{rangeStats.newBookings}</dd>
            </div>
          </dl>
        )}

        {rangeEmpty && (
          <p className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm text-ink-500">
            No jobs or payments in this range. Try widening the dates or check back after more activity.
          </p>
        )}

        {!canExport && (
          <p className="mt-3 text-xs text-ink-400">CSV export is available to owners and admins.</p>
        )}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="This week" />
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Period</dt>
              <dd className="font-semibold text-ink-900">{data.thisWeek.label}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Revenue</dt>
              <dd className="font-semibold text-ink-900">
                {formatReportingMoney(data.thisWeek.revenueCents, currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Jobs completed</dt>
              <dd className="font-semibold text-ink-900">{data.thisWeek.jobsCompleted}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">New bookings</dt>
              <dd className="font-semibold text-ink-900">{data.thisWeek.newBookings}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <CardHeader title="This month" />
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Period</dt>
              <dd className="font-semibold text-ink-900">{data.thisMonth.label}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Revenue</dt>
              <dd className="font-semibold text-ink-900">
                {formatReportingMoney(data.thisMonth.revenueCents, currency)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Jobs completed</dt>
              <dd className="font-semibold text-ink-900">{data.thisMonth.jobsCompleted}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">New bookings</dt>
              <dd className="font-semibold text-ink-900">{data.thisMonth.newBookings}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <CardHeader title="Weekly revenue (last 4 weeks)" />
        <ul className="mt-4 space-y-3">
          {data.weeklyTrend.map((week) => (
            <li key={week.weekLabel}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-ink-600">{week.weekLabel}</span>
                <span className="font-semibold text-ink-900">
                  {formatReportingMoney(week.revenueCents, currency)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-400"
                  style={{ width: `${Math.round((week.revenueCents / maxTrend) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

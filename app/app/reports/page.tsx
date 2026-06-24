import { redirect } from "next/navigation";
import { Card, CardHeader, PageHeader, StatCard } from "@/components/app/ui";
import { getAppSession } from "@/server/permissions/session";
import { getReportingData, formatReportingMoney } from "@/server/services/reporting";
import { prisma } from "@/lib/db/prisma";

export default async function ReportsPage() {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/reports");

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true, currency: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const currency = org?.currency ?? "USD";

  const data = await getReportingData(session.organizationId, timeZone, currency);
  const maxTrend = Math.max(...data.weeklyTrend.map((w) => w.revenueCents), 1);

  return (
    <>
      <PageHeader title="Reports" subtitle="Revenue, completed jobs, and outstanding balances." />

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

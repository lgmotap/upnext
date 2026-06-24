import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHeader, PageHeader } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { formatMoney } from "@/lib/money/format";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { getAppSession } from "@/server/permissions/session";
import { listPaymentRecordsForOrg, paymentAggregatesForOrg } from "@/server/repositories/payments";
import { prisma } from "@/lib/db/prisma";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink-950">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </Card>
  );
}

export default async function PaymentsPage() {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/payments");

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true, currency: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const currency = org?.currency ?? "USD";

  const [payments, aggregates] = await Promise.all([
    listPaymentRecordsForOrg(session.organizationId),
    paymentAggregatesForOrg(session.organizationId),
  ]);

  const overdueCount = payments.filter((p) => p.status === "overdue").length;
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Track what's paid, pending, and overdue."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Collected"
          value={formatMoney(aggregates.collectedCents, currency)}
          hint="All paid jobs"
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(aggregates.outstandingCents, currency)}
          hint={pendingCount ? `${pendingCount} pending link(s)` : undefined}
        />
        <StatCard
          label="Overdue"
          value={formatMoney(aggregates.overdueCents, currency)}
          hint={overdueCount ? `${overdueCount} to chase` : undefined}
        />
      </div>

      <Card className="mt-4 overflow-hidden">
        <CardHeader title="All payments" />
        {payments.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-500">
            No payment records yet. Accept a booking to create a job and payment row.
          </p>
        ) : (
          <>
            <div className="hidden grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-ink-100 px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-400 md:grid">
              <span>Customer</span>
              <span>Job</span>
              <span>Amount</span>
              <span>Status</span>
              <span className="text-right">Updated</span>
            </div>
            <ul className="divide-y divide-ink-100">
              {payments.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/app/jobs/${p.jobId}`}
                    className="grid grid-cols-2 gap-2 px-5 py-3.5 transition hover:bg-ink-50/60 md:grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr] md:items-center md:gap-3"
                  >
                    <span className="text-sm font-semibold text-ink-950">
                      {p.customer.firstName} {p.customer.lastName}
                    </span>
                    <span className="truncate text-sm text-ink-600">{p.job.title}</span>
                    <span className="text-sm font-semibold text-ink-900">
                      {formatMoney(p.amountCents, p.currency)}
                    </span>
                    <span>
                      <StatusBadge status={p.status} />
                    </span>
                    <span className="text-right text-xs text-ink-500 md:text-right">
                      {formatDisplayDateTime(p.updatedAt, timeZone)}
                      {p.provider === "stripe" ? " · Stripe" : " · Manual"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}

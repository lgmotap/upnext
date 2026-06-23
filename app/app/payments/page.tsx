import { Card, CardHeader, PageHeader, StatCard } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { payments, formatMoney } from "@/lib/mock/data";

export default function PaymentsPage() {
  const paid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountCents, 0);
  const outstanding = payments
    .filter((p) => p.status === "pending" || p.status === "overdue")
    .reduce((s, p) => s + p.amountCents, 0);

  return (
    <>
      <PageHeader title="Payments" subtitle="Track what's paid, pending, and overdue." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Collected this week" value={formatMoney(paid)} delta="+18% vs last" trend="up" />
        <StatCard label="Outstanding" value={formatMoney(outstanding)} delta="2 to chase" trend="down" />
        <StatCard label="Overdue" value={formatMoney(payments.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amountCents, 0))} />
      </div>

      <Card className="mt-4 overflow-hidden">
        <CardHeader title="All payments" />
        <div className="hidden grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-ink-100 px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-400 md:grid">
          <span>Customer</span>
          <span>Job</span>
          <span>Amount</span>
          <span>Status</span>
          <span className="text-right">Due / method</span>
        </div>
        <ul className="divide-y divide-ink-100">
          {payments.map((p) => (
            <li
              key={p.id}
              className="grid grid-cols-2 gap-2 px-5 py-3.5 md:grid-cols-[1.4fr_1.2fr_0.8fr_0.8fr_0.8fr] md:items-center md:gap-3"
            >
              <span className="text-sm font-semibold text-ink-950">{p.customer}</span>
              <span className="text-sm text-ink-600">{p.job}</span>
              <span className="text-sm font-semibold text-ink-900">{formatMoney(p.amountCents)}</span>
              <span><StatusBadge status={p.status} /></span>
              <span className="text-right text-xs text-ink-500">{p.date} · {p.method}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

import {
  Ban,
  CalendarCheck,
  DollarSign,
  Users,
  type LucideIcon,
} from "lucide-react";
import { formatMoney } from "@/lib/money/format";
import type { DashboardPerformanceData } from "@/lib/reporting/dashboard-performance.types";
import { DashboardChangeBadge } from "@/components/app/dashboard/DashboardMetricCell";

function MetricTile({
  label,
  value,
  changePct,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  changePct: number | null;
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <div className="rounded-xl bg-ink-50 p-4 ring-1 ring-ink-100">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-ink-950">{value}</p>
      <div className="mt-1">
        <DashboardChangeBadge pct={changePct} />
      </div>
    </div>
  );
}

export function DashboardMetricsRow({
  performance,
  currency,
}: {
  performance: DashboardPerformanceData;
  currency: string;
}) {
  const { metrics } = performance;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricTile
        label="Jobs completed"
        value={String(metrics.jobsCompleted)}
        changePct={metrics.jobsCompletedChangePct}
        icon={CalendarCheck}
        iconClassName="bg-emerald-100 text-emerald-700"
      />
      <MetricTile
        label="Average job value"
        value={formatMoney(metrics.averageJobValueCents, currency)}
        changePct={metrics.averageJobValueChangePct}
        icon={DollarSign}
        iconClassName="bg-sky-100 text-sky-700"
      />
      <MetricTile
        label="Repeat customers"
        value={`${metrics.repeatCustomersPct}%`}
        changePct={metrics.repeatCustomersChangePct}
        icon={Users}
        iconClassName="bg-violet-100 text-violet-700"
      />
      <MetricTile
        label="Canceled / rescheduled"
        value={String(metrics.canceledRescheduled)}
        changePct={metrics.canceledRescheduledChangePct}
        icon={Ban}
        iconClassName="bg-amber-100 text-amber-800"
      />
    </div>
  );
}

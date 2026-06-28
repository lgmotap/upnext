import { formatMoney } from "@/lib/money/format";
import type { DashboardPerformanceData } from "@/lib/reporting/dashboard-performance.types";
import { DashboardDateRangeSelect } from "@/components/app/dashboard/DashboardDateRangeSelect";
import { MiniMetricCard } from "@/components/app/dashboard/MiniMetricCard";
import {
  dashboardSectionCardClass,
  dashboardType,
} from "@/components/app/dashboard/dashboard-card-styles";

export function PerformanceOverviewCard({
  performance,
  currency,
  rangePresets,
}: {
  performance: DashboardPerformanceData;
  currency: string;
  rangePresets: ReadonlyArray<{ label: string; fromYmd: string; toYmd: string }>;
}) {
  const { bookings, metrics, range } = performance;

  return (
    <div className={`flex flex-col ${dashboardSectionCardClass}`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#EEF1F5] px-5 py-3.5">
        <h2 className={dashboardType.cardTitle}>Performance overview</h2>
        <DashboardDateRangeSelect
          fromYmd={range.fromYmd}
          toYmd={range.toYmd}
          presets={rangePresets}
          fromParam="from"
          toParam="to"
          ariaLabel="Performance overview date range"
          compact
        />
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        <MiniMetricCard
          variant="sparkline"
          title="New customers"
          value={String(bookings.newCustomers)}
          sparklineData={bookings.dailyNewCustomers}
          sparklineColor="#2563EB"
        />
        <MiniMetricCard
          variant="sparkline"
          title="Jobs scheduled"
          value={String(bookings.jobsScheduled)}
          sparklineData={bookings.dailyJobsScheduled}
          sparklineColor="#2563EB"
        />
        <MiniMetricCard
          variant="plain"
          title="Jobs completed"
          value={String(metrics.jobsCompleted)}
        />
        <MiniMetricCard
          variant="plain"
          title="Average job value"
          value={formatMoney(metrics.averageJobValueCents, currency)}
        />
        <MiniMetricCard
          variant="plain"
          title="Repeat customers"
          value={`${metrics.repeatCustomersPct}%`}
        />
        <MiniMetricCard
          variant="plain"
          title="Canceled / rescheduled"
          value={String(metrics.canceledRescheduled)}
        />
      </div>
    </div>
  );
}

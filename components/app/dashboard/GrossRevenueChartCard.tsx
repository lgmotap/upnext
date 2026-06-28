import { formatMoney } from "@/lib/money/format";
import type { DashboardPerformanceData } from "@/lib/reporting/dashboard-performance.types";
import { GrossRevenueChart } from "@/components/app/dashboard/GrossRevenueChart";
import { DashboardDateRangeSelect } from "@/components/app/dashboard/DashboardDateRangeSelect";
import {
  dashboardCardClass,
  dashboardType,
} from "@/components/app/dashboard/dashboard-card-styles";

function priorPeriodLabel(range: DashboardPerformanceData["range"]): string {
  if (range.label.startsWith("Last ")) {
    return `vs previous ${range.label.slice(5)}`;
  }
  return "vs prior period";
}

export function GrossRevenueChartCard({
  performance,
  currency,
  rangePresets,
}: {
  performance: DashboardPerformanceData;
  currency: string;
  rangePresets: ReadonlyArray<{ label: string; fromYmd: string; toYmd: string }>;
}) {
  const { revenue, range } = performance;
  const n = revenue.dailyCents.length;

  const changeLabel =
    revenue.changePct === null
      ? null
      : `${revenue.changePct >= 0 ? "+" : ""}${revenue.changePct}%`;

  const chartData = revenue.dailyCents.map((cents, index) => ({
    label: revenue.dailyLabels[index] ?? "",
    revenue: cents,
  }));

  return (
    <div className={`flex flex-col p-5 ${dashboardCardClass}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={dashboardType.cardTitle}>Gross revenue</h2>
        <DashboardDateRangeSelect
          fromYmd={range.fromYmd}
          toYmd={range.toYmd}
          presets={rangePresets}
          fromParam="revenueFrom"
          toParam="revenueTo"
          ariaLabel="Gross revenue date range"
          compact
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={dashboardType.revenueTotal}>{formatMoney(revenue.totalCents, currency)}</span>
        {changeLabel ? (
          <>
            <span
              className={`${dashboardType.revenueDelta} ${
                (revenue.changePct ?? 0) >= 0 ? "text-[#12B76A]" : "text-[#F04438]"
              }`}
            >
              {changeLabel}
            </span>
            <span className={dashboardType.revenueCompare}>{priorPeriodLabel(range)}</span>
          </>
        ) : null}
      </div>

      {n === 0 ? (
        <p className={`mt-6 ${dashboardType.body}`}>No revenue in this period.</p>
      ) : (
        <div className="mt-4">
          <GrossRevenueChart
            data={chartData}
            currency={currency}
            ariaLabel={`Gross revenue chart, total ${formatMoney(revenue.totalCents, currency)}`}
          />
        </div>
      )}

      <p className={`mt-2.5 ${dashboardType.footnote}`}>
        Completed job revenue · {range.label}
      </p>
    </div>
  );
}

import { PerformanceOverviewCard } from "@/components/app/dashboard/PerformanceOverviewCard";
import { GrossRevenueChartCard } from "@/components/app/dashboard/GrossRevenueChartCard";
import type { DashboardPerformanceData } from "@/lib/reporting/dashboard-performance.types";

export function PerformanceSection({
  performanceOverview,
  revenuePerformance,
  currency,
  rangePresets,
}: {
  performanceOverview: DashboardPerformanceData;
  revenuePerformance: DashboardPerformanceData;
  currency: string;
  rangePresets: ReadonlyArray<{ label: string; fromYmd: string; toYmd: string }>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.9fr_1.4fr]">
      <PerformanceOverviewCard
        performance={performanceOverview}
        currency={currency}
        rangePresets={rangePresets}
      />
      <GrossRevenueChartCard
        performance={revenuePerformance}
        currency={currency}
        rangePresets={rangePresets}
      />
    </div>
  );
}

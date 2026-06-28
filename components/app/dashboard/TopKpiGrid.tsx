import { TopKpiCard } from "@/components/app/dashboard/TopKpiCard";
import type { DashboardQueueStat } from "@/server/services/dashboard";

export function TopKpiGrid({ stats }: { stats: DashboardQueueStat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <TopKpiCard
          key={s.id}
          id={s.id}
          title={s.label}
          value={s.value}
          subtext={s.subtext}
          href={s.href}
        />
      ))}
    </div>
  );
}

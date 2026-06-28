import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  CreditCard,
  UserX,
  type LucideIcon,
} from "lucide-react";
import {
  dashboardKpiCardClass,
  dashboardType,
} from "@/components/app/dashboard/dashboard-card-styles";
import type { DashboardQueueStat } from "@/server/services/dashboard";

const KPI_ICON: Record<
  DashboardQueueStat["id"],
  { Icon: LucideIcon; chipBg: string; chipColor: string }
> = {
  jobs_today: {
    Icon: CalendarDays,
    chipBg: "#EAF2FF",
    chipColor: "#2563EB",
  },
  new_bookings: {
    Icon: CalendarPlus,
    chipBg: "#EAFBF2",
    chipColor: "#12B76A",
  },
  unassigned_today: {
    Icon: UserX,
    chipBg: "#FEECEC",
    chipColor: "#F04438",
  },
  awaiting_payment: {
    Icon: CreditCard,
    chipBg: "#FFF4E5",
    chipColor: "#F59E0B",
  },
};

export function TopKpiCard({
  id,
  title,
  value,
  subtext,
  href,
}: {
  id: DashboardQueueStat["id"];
  title: string;
  value: string;
  subtext: string;
  href: string;
}) {
  const meta = KPI_ICON[id];
  const Icon = meta.Icon;

  return (
    <Link
      href={href}
      className={`block transition hover:border-[#CBD5E1] ${dashboardKpiCardClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={dashboardType.kpiLabel}>{title}</p>
          <p className={`mt-1 ${dashboardType.kpiValue}`}>{value}</p>
          <p className={`mt-1.5 ${dashboardType.kpiSubtext}`}>{subtext}</p>
        </div>
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: meta.chipBg, color: meta.chipColor }}
        >
          <Icon className="size-4" aria-hidden />
        </div>
      </div>
    </Link>
  );
}

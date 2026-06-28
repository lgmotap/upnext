import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  CreditCard,
  Inbox,
  Truck,
  type LucideIcon,
} from "lucide-react";
import {
  dashboardSectionCardClass,
  dashboardType,
} from "@/components/app/dashboard/dashboard-card-styles";
import type { ActivityFeedItem, ActivityFeedType } from "@/server/services/activity-feed";

const MAX_ROWS = 5;

const TYPE_META: Record<ActivityFeedType, { icon: LucideIcon; iconClassName: string }> = {
  booking: { icon: Inbox, iconClassName: "bg-emerald-50 text-emerald-600" },
  job: { icon: CalendarCheck, iconClassName: "bg-sky-50 text-sky-600" },
  payment: { icon: CreditCard, iconClassName: "bg-amber-50 text-amber-600" },
  crew: { icon: Truck, iconClassName: "bg-violet-50 text-violet-600" },
  system: { icon: Bell, iconClassName: "bg-slate-100 text-slate-600" },
};

function ActivityRow({ item }: { item: ActivityFeedItem }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const inner = (
    <div className="flex min-h-[52px] items-center gap-3 px-5 py-2.5">
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${meta.iconClassName}`}
      >
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={`truncate ${dashboardType.rowTitle}`}>{item.title}</p>
        <p className={`truncate ${dashboardType.rowMeta}`}>{item.body}</p>
      </div>
      <p className={`shrink-0 ${dashboardType.rowMeta}`}>{item.when}</p>
    </div>
  );

  if (item.href) {
    return (
      <li>
        <Link href={item.href} className="block transition hover:bg-slate-50/60">
          {inner}
        </Link>
      </li>
    );
  }

  return <li>{inner}</li>;
}

export function DashboardActivityFeed({
  items,
  showViewAllLink = false,
}: {
  items: ActivityFeedItem[];
  showViewAllLink?: boolean;
}) {
  const visibleItems = items.slice(0, MAX_ROWS);

  return (
    <div className={dashboardSectionCardClass}>
      <div className="border-b border-[#EEF1F5] px-5 py-3.5">
        <h2 className={dashboardType.cardTitle}>Recent activity</h2>
      </div>

      {visibleItems.length === 0 ? (
        <p className={`px-5 py-6 ${dashboardType.body}`}>No recent activity.</p>
      ) : (
        <ul className="divide-y divide-[#EEF1F5]">
          {visibleItems.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      {showViewAllLink ? (
        <div className="border-t border-[#EEF1F5] px-5 py-2.5">
          <Link href="/app/activity" className={dashboardType.link}>
            View all activity →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

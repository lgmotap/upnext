import { UpcomingScheduleCard } from "@/components/app/dashboard/UpcomingScheduleCard";
import { DashboardActivityFeed } from "@/components/app/dashboard/DashboardActivityFeed";
import type { ActivityFeedItem } from "@/server/services/activity-feed";
import type { DashboardJobRow } from "@/server/services/dashboard";

export function OperationsSection({
  jobs,
  activity,
}: {
  jobs: DashboardJobRow[];
  activity: ActivityFeedItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <UpcomingScheduleCard jobs={jobs} />
      <DashboardActivityFeed items={activity} showViewAllLink />
    </div>
  );
}

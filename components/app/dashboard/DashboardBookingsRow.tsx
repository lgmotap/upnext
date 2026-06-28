import type { DashboardPerformanceData } from "@/lib/reporting/dashboard-performance.types";
import { DashboardMetricCell } from "@/components/app/dashboard/DashboardMetricCell";

export function DashboardBookingsRow({ performance }: { performance: DashboardPerformanceData }) {
  const { bookings } = performance;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <DashboardMetricCell
        label="New customers"
        value={String(bookings.newCustomers)}
        changePct={bookings.newCustomersChangePct}
      />
      <DashboardMetricCell
        label="Jobs scheduled"
        value={String(bookings.jobsScheduled)}
        changePct={bookings.jobsScheduledChangePct}
      />
    </div>
  );
}

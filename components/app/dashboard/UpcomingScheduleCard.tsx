import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/app/ui";
import {
  dashboardSectionCardClass,
  dashboardType,
} from "@/components/app/dashboard/dashboard-card-styles";
import type { DashboardJobRow } from "@/server/services/dashboard";

const MAX_ROWS = 5;

function AssigneeBadge({ job }: { job: DashboardJobRow }) {
  if (job.assigneeName) {
    return (
      <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
        <Avatar
          initials={job.assigneeInitials ?? "?"}
          className="size-4 shrink-0 bg-emerald-100 text-emerald-700"
        />
        <span className="truncate">{job.assigneeName.split(" ")[0]}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
      Unassigned
    </span>
  );
}

function ScheduleRow({ job }: { job: DashboardJobRow }) {
  return (
    <div className="flex min-h-[52px] items-center px-5 py-2.5">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className={`${dashboardType.rowMeta} font-medium text-[#0B1F3A]`}>
              {job.startTime}
            </span>
            <Link
              href={`/app/jobs/${job.id}`}
              className={`truncate ${dashboardType.rowTitle} hover:text-[#2563EB]`}
            >
              {job.customerName}
            </Link>
          </div>
          <p className={`mt-0.5 truncate ${dashboardType.rowMeta}`}>{job.serviceName}</p>
          {job.addressLine ? (
            <p
              className={`mt-0.5 truncate ${dashboardType.rowMeta} lg:hidden`}
              title={job.addressLine}
            >
              {job.addressLine}
            </p>
          ) : null}
        </div>
        <div className="shrink-0">
          <AssigneeBadge job={job} />
        </div>
      </div>
    </div>
  );
}

export function UpcomingScheduleCard({ jobs }: { jobs: DashboardJobRow[] }) {
  const visibleJobs = jobs.slice(0, MAX_ROWS);

  return (
    <div className={dashboardSectionCardClass}>
      <div className="border-b border-[#EEF1F5] px-5 py-3.5">
        <h2 className={dashboardType.cardTitle}>Upcoming schedule</h2>
      </div>

      {visibleJobs.length === 0 ? (
        <p className={`px-5 py-6 ${dashboardType.body}`}>No upcoming jobs.</p>
      ) : (
        <>
          <div className="divide-y divide-[#EEF1F5] lg:hidden">
            {visibleJobs.map((job) => (
              <ScheduleRow key={job.id} job={job} />
            ))}
          </div>

          <div className="hidden lg:block">
            <table className="w-full table-fixed text-left">
              <thead>
                <tr className={`border-b border-[#EEF1F5] ${dashboardType.tableHeader}`}>
                  <th className="w-[72px] px-5 py-2">Time</th>
                  <th className="w-[24%] px-5 py-2">Customer</th>
                  <th className="w-[20%] px-5 py-2">Service</th>
                  <th className="px-5 py-2">Address</th>
                  <th className="w-[128px] px-5 py-2">Assigned to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1F5]">
                {visibleJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/60">
                    <td className={`whitespace-nowrap px-5 py-2.5 text-sm font-medium text-[#0B1F3A]`}>
                      {j.startTime}
                    </td>
                    <td className="px-5 py-2.5">
                      <Link
                        href={`/app/jobs/${j.id}`}
                        className={`block truncate ${dashboardType.rowTitle} hover:text-[#2563EB]`}
                      >
                        {j.customerName}
                      </Link>
                    </td>
                    <td className={`truncate px-5 py-2.5 ${dashboardType.rowMeta}`}>
                      {j.serviceName}
                    </td>
                    <td
                      className={`truncate px-5 py-2.5 ${dashboardType.rowMeta}`}
                      title={j.addressLine ?? undefined}
                    >
                      {j.addressLine ?? "—"}
                    </td>
                    <td className="px-5 py-2.5">
                      <AssigneeBadge job={j} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="border-t border-[#EEF1F5] px-5 py-2.5">
        <Link href="/app/jobs" className={`inline-flex items-center gap-0.5 ${dashboardType.link}`}>
          View full schedule <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

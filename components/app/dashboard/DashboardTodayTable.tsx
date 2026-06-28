import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardHeader, Avatar, AppButton } from "@/components/app/ui";
import type { DashboardJobRow } from "@/server/services/dashboard";

export function DashboardTodayTable({ jobs }: { jobs: DashboardJobRow[] }) {
  return (
    <Card>
      <CardHeader
        title="Today's schedule"
        action={
          <Link
            href="/app/jobs?date=today"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700"
          >
            All jobs <ChevronRight className="size-3.5" />
          </Link>
        }
      />
      {jobs.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-ink-500">No jobs scheduled for today.</p>
          <AppButton href="/app/calendar" variant="outline" className="mt-4">
            View calendar
          </AppButton>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-2.5 font-semibold">Time</th>
                  <th className="px-5 py-2.5 font-semibold">Customer</th>
                  <th className="px-5 py-2.5 font-semibold">Service</th>
                  <th className="hidden px-5 py-2.5 font-semibold md:table-cell">Address</th>
                  <th className="px-5 py-2.5 font-semibold">Assigned to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-ink-50/60">
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-ink-900">{j.startTime}</td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/app/jobs/${j.id}`}
                        className="font-semibold text-ink-950 hover:text-brand-700"
                      >
                        {j.customerName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{j.serviceName}</td>
                    <td
                      className="hidden max-w-[12rem] truncate px-5 py-3 text-ink-500 md:table-cell"
                      title={j.addressLine ?? undefined}
                    >
                      {j.addressLine ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      {j.assigneeName ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          <Avatar
                            initials={j.assigneeInitials ?? "?"}
                            className="size-5 bg-emerald-100 text-emerald-700"
                          />
                          {j.assigneeName.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          Unassigned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-ink-100 px-5 py-3">
            <Link
              href="/app/jobs?date=today"
              className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700"
            >
              View full schedule <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}

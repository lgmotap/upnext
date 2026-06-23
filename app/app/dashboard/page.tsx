import Link from "next/link";
import { ChevronRight, Check, X } from "lucide-react";
import { Card, CardHeader, PageHeader, StatCard, Avatar, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import {
  dashboardStats,
  jobs,
  bookingRequests,
  weekRevenue,
  activity,
  business,
} from "@/lib/mock/data";

export default function DashboardPage() {
  const todayJobs = jobs.filter((j) => j.date === "Today");
  const pending = bookingRequests.filter((b) => b.status === "pending");

  return (
    <>
      <PageHeader
        title={`Good morning, ${business.ownerName.split(" ")[0]}`}
        subtitle="Tuesday, June 16 · here's what's happening today."
        action={<AppButton href="/app/calendar">View calendar</AppButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* schedule */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's schedule"
            action={
              <Link href="/app/jobs" className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700">
                All jobs <ChevronRight className="size-3.5" />
              </Link>
            }
          />
          <ul className="divide-y divide-ink-100">
            {todayJobs.map((j) => (
              <li key={j.id}>
                <Link href={`/app/jobs/${j.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60">
                  <Avatar initials={j.customer.split(" ").map((w) => w[0]).slice(0, 2).join("")} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-950">{j.customer}</p>
                    <p className="truncate text-xs text-ink-500">
                      {j.service} · {j.start}
                    </p>
                  </div>
                  <span className="hidden items-center gap-1.5 text-xs text-ink-500 sm:flex">
                    <Avatar initials={j.assigneeInitials} className="size-6 bg-ink-100 text-ink-600" />
                    {j.assignee.split(" ")[0]}
                  </span>
                  <StatusBadge status={j.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        {/* booking requests */}
        <Card>
          <CardHeader
            title="Booking requests"
            action={<span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">{pending.length} new</span>}
          />
          <ul className="divide-y divide-ink-100">
            {pending.map((b) => (
              <li key={b.id} className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-950">{b.customer}</p>
                    <p className="truncate text-xs text-ink-500">
                      {b.service} · {b.requestedAt}
                    </p>
                  </div>
                  <button aria-label="Accept" className="flex size-7 items-center justify-center rounded-lg bg-brand-400 text-brand-950 hover:bg-brand-300">
                    <Check className="size-4" />
                  </button>
                  <button aria-label="Decline" className="flex size-7 items-center justify-center rounded-lg bg-ink-100 text-ink-500 hover:bg-ink-200">
                    <X className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-5 py-3">
            <Link href="/app/bookings" className="text-xs font-semibold text-brand-700">
              View all requests →
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* revenue */}
        <Card className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-bold text-ink-950">Revenue</h2>
            <span className="text-xs text-ink-400">Mon–Sun</span>
          </div>
          <div className="flex h-32 items-end gap-2">
            {weekRevenue.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`flex-1 rounded-t-lg ${i === weekRevenue.length - 1 ? "bg-brand-400" : "bg-brand-500/70"}`}
              />
            ))}
          </div>
        </Card>

        {/* activity */}
        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" />
          <ul className="divide-y divide-ink-100">
            {activity.map((a, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
                <p className="text-sm text-ink-700">
                  <span className="font-semibold text-ink-950">{a.who}</span> {a.what}
                  <span className="block text-xs text-ink-400">{a.when}</span>
                </p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}

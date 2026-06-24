import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Check, X } from "lucide-react";
import { Card, CardHeader, PageHeader, StatCard, Avatar, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { getDashboardData } from "@/server/services/dashboard";
import { acceptBookingAction, declineBookingAction } from "@/server/actions/bookings";
import { prisma } from "@/lib/db/prisma";

export default async function DashboardPage() {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/dashboard");

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true, currency: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const currency = org?.currency ?? "USD";

  const data = await getDashboardData(
    session.organizationId,
    timeZone,
    currency,
    session.name ?? session.email.split("@")[0],
  );
  const canRespond = canManageBookings(session);

  return (
    <>
      <PageHeader
        title={`Good morning, ${data.greetingName}`}
        subtitle={`${data.dateLabel} · here's what's happening today.`}
        action={<AppButton href="/app/calendar">View calendar</AppButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's schedule"
            action={
              <Link href="/app/jobs" className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-700">
                All jobs <ChevronRight className="size-3.5" />
              </Link>
            }
          />
          {data.todayJobs.length === 0 ? (
            <p className="px-5 py-8 text-sm text-ink-500">No jobs scheduled for today.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.todayJobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/app/jobs/${j.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60">
                    <Avatar initials={j.customerInitials} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-950">{j.customerName}</p>
                      <p className="truncate text-xs text-ink-500">
                        {j.serviceName} · {j.startTime}
                      </p>
                    </div>
                    {j.assigneeInitials && j.assigneeName && (
                      <span className="hidden items-center gap-1.5 text-xs text-ink-500 sm:flex">
                        <Avatar initials={j.assigneeInitials} className="size-6 bg-ink-100 text-ink-600" />
                        {j.assigneeName.split(" ")[0]}
                      </span>
                    )}
                    <StatusBadge status={j.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Booking requests"
            action={
              data.pendingCount > 0 ? (
                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-700">
                  {data.pendingCount} new
                </span>
              ) : undefined
            }
          />
          {data.pendingBookings.length === 0 ? (
            <p className="px-5 py-8 text-sm text-ink-500">No pending requests.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.pendingBookings.map((b) => (
                <li key={b.id} className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/app/bookings/${b.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-950">{b.customerName}</p>
                      <p className="truncate text-xs text-ink-500">
                        {b.serviceName} · {b.requestedLabel}
                      </p>
                    </Link>
                    {canRespond && (
                      <>
                        <form action={acceptBookingAction}>
                          <input type="hidden" name="bookingRequestId" value={b.id} />
                          <button
                            type="submit"
                            aria-label="Accept"
                            className="flex size-7 items-center justify-center rounded-lg bg-brand-400 text-brand-950 hover:bg-brand-300"
                          >
                            <Check className="size-4" />
                          </button>
                        </form>
                        <form action={declineBookingAction}>
                          <input type="hidden" name="bookingRequestId" value={b.id} />
                          <button
                            type="submit"
                            aria-label="Decline"
                            className="flex size-7 items-center justify-center rounded-lg bg-ink-100 text-ink-500 hover:bg-ink-200"
                          >
                            <X className="size-4" />
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-5 py-3">
            <Link href="/app/bookings" className="text-xs font-semibold text-brand-700">
              View all requests →
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-bold text-ink-950">Revenue</h2>
            <span className="text-xs text-ink-400">{data.weekRevenueTotalLabel} this week</span>
          </div>
          <div className="flex h-32 items-end gap-2">
            {data.weekRevenueBars.map((h, i) => (
              <div
                key={i}
                style={{ height: `${Math.max(h, 4)}%` }}
                className={`flex-1 rounded-t-lg ${i === data.weekRevenueBars.length - 1 ? "bg-brand-400" : "bg-brand-500/70"}`}
              />
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent activity" />
          {data.activity.length === 0 ? (
            <p className="px-5 py-8 text-sm text-ink-500">Activity will show up as bookings and jobs come in.</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {data.activity.map((a, i) => (
                <li key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-400" />
                  <p className="text-sm text-ink-700">
                    <span className="font-semibold text-ink-950">{a.who}</span> {a.what}
                    <span className="block text-xs text-ink-400">{a.when}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

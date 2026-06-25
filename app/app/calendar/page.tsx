import { redirect } from "next/navigation";
import { Card, PageHeader, AppButton } from "@/components/app/ui";
import { CalendarWeekNav } from "@/components/app/CalendarWeekNav";
import { CalendarMonthNav } from "@/components/app/CalendarMonthNav";
import { CalendarViewToggle } from "@/components/app/CalendarViewToggle";
import { CalendarJobChip, CalendarPendingChip } from "@/components/app/CalendarJobChip";
import { OwnerCalendarMonthGrid } from "@/components/app/OwnerCalendarMonthGrid";
import { getMonthRange, getWeekRange } from "@/lib/datetime/calendar";
import { formatTimeHmInTimezone, formatYmdInTimezone, localDateTimeToUtc } from "@/lib/datetime/timezone";
import { buildJobConflictMap } from "@/lib/scheduling/conflicts";
import { DEFAULT_SCHEDULING_POLICY } from "@/lib/scheduling/policy";
import { getAppSession } from "@/server/permissions/session";
import { listPendingBookingsInRange } from "@/server/repositories/bookings";
import { listJobsInRange } from "@/server/repositories/jobs";
import { prisma } from "@/lib/db/prisma";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; month?: string; view?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/calendar");

  const params = await searchParams;
  const view = params.view === "month" ? "month" : "week";

  const [org, profile] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { timezone: true },
    }),
    prisma.businessProfile.findUnique({
      where: { organizationId: session.organizationId },
      select: { bufferMinutesBetweenJobs: true, providerCarryOverMinutes: true },
    }),
  ]);
  const timeZone = org?.timezone ?? "America/New_York";
  const policy = {
    bufferMinutesBetweenJobs: profile?.bufferMinutesBetweenJobs ?? DEFAULT_SCHEDULING_POLICY.bufferMinutesBetweenJobs,
    providerCarryOverMinutes: profile?.providerCarryOverMinutes ?? DEFAULT_SCHEDULING_POLICY.providerCarryOverMinutes,
  };

  if (view === "month") {
    const todayYmd = formatYmdInTimezone(new Date(), timeZone);
    const monthKey =
      params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : todayYmd.slice(0, 7);
    const monthRange = getMonthRange(timeZone, monthKey);

    const [jobs, pending] = await Promise.all([
      listJobsInRange(session.organizationId, monthRange.rangeStart, monthRange.rangeEnd),
      listPendingBookingsInRange(session.organizationId, monthRange.rangeStart, monthRange.rangeEnd),
    ]);

    const conflictMap = buildJobConflictMap(jobs, policy);
    const jobsByDate: Record<string, number> = {};
    const pendingByDate: Record<string, number> = {};
    const conflictJobIdsByDate: Record<string, number> = {};

    for (const j of jobs) {
      const ymd = formatYmdInTimezone(j.scheduledStartAt, timeZone);
      jobsByDate[ymd] = (jobsByDate[ymd] ?? 0) + 1;
      if (conflictMap.has(j.id)) {
        conflictJobIdsByDate[ymd] = (conflictJobIdsByDate[ymd] ?? 0) + 1;
      }
    }
    for (const b of pending) {
      const ymd = formatYmdInTimezone(b.requestedStartAt, timeZone);
      pendingByDate[ymd] = (pendingByDate[ymd] ?? 0) + 1;
    }

    const weekStartForToggle = getWeekRange(
      timeZone,
      localDateTimeToUtc(`${monthKey}-15`, "12:00", timeZone),
    ).days[0]?.date ?? monthRange.firstDay;

    return (
      <>
        <PageHeader
          title="Calendar"
          subtitle={monthRange.monthLabel}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <CalendarViewToggle view="month" weekStartYmd={weekStartForToggle} monthKey={monthKey} />
              <CalendarMonthNav monthKey={monthKey} isCurrentMonth={monthRange.isCurrentMonth} />
              <AppButton href="/app/calendar/scheduler" variant="outline">
                Scheduler
              </AppButton>
              <AppButton href="/app/jobs">View all jobs</AppButton>
            </div>
          }
        />

        <Card className="overflow-x-auto p-4">
          <OwnerCalendarMonthGrid
            monthKey={monthKey}
            timeZone={timeZone}
            todayYmd={monthRange.todayYmd}
            jobsByDate={jobsByDate}
            pendingByDate={pendingByDate}
            conflictJobIdsByDate={conflictJobIdsByDate}
          />
          <p className="mt-4 text-center text-xs text-ink-500">
            Click a day to open week view · Numbers show scheduled jobs ·{" "}
            <span className="font-medium text-amber-700">p</span> = pending requests
          </p>
        </Card>
      </>
    );
  }

  const anchor = params.week ? localDateTimeToUtc(params.week, "12:00", timeZone) : new Date();
  const { days, rangeStart, rangeEnd, weekLabel, todayYmd } = getWeekRange(timeZone, anchor);
  const weekStartYmd = days[0]?.date ?? "";
  const isCurrentWeek = weekStartYmd <= todayYmd && (days[6]?.date ?? "") >= todayYmd;
  const monthKey = weekStartYmd.slice(0, 7);

  const [jobs, pending] = await Promise.all([
    listJobsInRange(session.organizationId, rangeStart, rangeEnd),
    listPendingBookingsInRange(session.organizationId, rangeStart, rangeEnd),
  ]);

  const conflictMap = buildJobConflictMap(jobs, policy);

  const jobsByDate = Object.fromEntries(
    days.map((d) => [
      d.date,
      jobs.filter((j) => formatYmdInTimezone(j.scheduledStartAt, timeZone) === d.date),
    ]),
  );

  const pendingByDate = Object.fromEntries(
    days.map((d) => [
      d.date,
      pending.filter((b) => formatYmdInTimezone(b.requestedStartAt, timeZone) === d.date),
    ]),
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle={weekLabel}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CalendarViewToggle view="week" weekStartYmd={weekStartYmd} monthKey={monthKey} />
            <CalendarWeekNav weekStartYmd={weekStartYmd} isCurrentWeek={isCurrentWeek} />
            <AppButton href="/app/calendar/scheduler" variant="outline">
              Scheduler
            </AppButton>
            <AppButton href="/app/jobs">View all jobs</AppButton>
          </div>
        }
      />

      <Card className="overflow-x-auto p-3">
        <div className="grid min-w-[760px] grid-cols-7 gap-2">
          {days.map((d) => (
            <div key={d.date} className="min-h-[18rem]">
              <div
                className={`mb-2 rounded-xl px-3 py-2 text-center ${
                  d.isToday ? "bg-brand-950 text-white" : "bg-ink-50 text-ink-600"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide">{d.label}</p>
                <p className="text-lg font-bold">{d.dayNum}</p>
              </div>
              <div className="space-y-2">
                {(pendingByDate[d.date] ?? []).map((b) => (
                  <CalendarPendingChip
                    key={b.id}
                    bookingRequestId={b.id}
                    timeLabel={formatTimeHmInTimezone(b.requestedStartAt, timeZone)}
                    customerName={`${b.customer.firstName} ${b.customer.lastName}`}
                    serviceName={b.service.name}
                  />
                ))}
                {(jobsByDate[d.date] ?? []).map((j) => (
                  <CalendarJobChip
                    key={j.id}
                    jobId={j.id}
                    timeLabel={formatTimeHmInTimezone(j.scheduledStartAt, timeZone)}
                    customerName={`${j.customer.firstName} ${j.customer.lastName}`}
                    serviceName={j.service.name}
                    status={j.status}
                    conflicts={conflictMap.get(j.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

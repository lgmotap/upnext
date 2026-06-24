import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, PageHeader, AppButton } from "@/components/app/ui";
import { CalendarWeekNav } from "@/components/app/CalendarWeekNav";
import { getWeekRange } from "@/lib/datetime/calendar";
import { formatTimeHmInTimezone, localDateTimeToUtc } from "@/lib/datetime/timezone";
import { getAppSession } from "@/server/permissions/session";
import { listJobsInRange } from "@/server/repositories/jobs";
import { prisma } from "@/lib/db/prisma";

const statusColor: Record<string, string> = {
  in_progress: "border-amber-400 bg-amber-50 text-amber-800",
  confirmed: "border-brand-400 bg-brand-50 text-brand-800",
  scheduled: "border-ink-300 bg-ink-50 text-ink-700",
  completed: "border-brand-500 bg-brand-100 text-brand-800",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/calendar");

  const params = await searchParams;
  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";

  const anchor = params.week ? localDateTimeToUtc(params.week, "12:00", timeZone) : new Date();
  const { days, rangeStart, rangeEnd, weekLabel, todayYmd } = getWeekRange(timeZone, anchor);
  const weekStartYmd = days[0]?.date ?? "";
  const isCurrentWeek = weekStartYmd <= todayYmd && days[6]?.date >= todayYmd;
  const jobs = await listJobsInRange(session.organizationId, rangeStart, rangeEnd);

  const jobsByDate = Object.fromEntries(
    days.map((d) => [
      d.date,
      jobs.filter((j) => formatYmd(j.scheduledStartAt, timeZone) === d.date),
    ]),
  );

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle={weekLabel}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <CalendarWeekNav weekStartYmd={weekStartYmd} isCurrentWeek={isCurrentWeek} />
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
                {(jobsByDate[d.date] ?? []).map((j) => (
                  <Link
                    key={j.id}
                    href={`/app/jobs/${j.id}`}
                    className={`block rounded-lg border-l-2 px-2.5 py-2 text-left transition hover:shadow-soft ${
                      statusColor[j.status] ?? statusColor.scheduled
                    }`}
                  >
                    <p className="text-[11px] font-bold">
                      {formatTimeHmInTimezone(j.scheduledStartAt, timeZone)}
                    </p>
                    <p className="truncate text-xs font-semibold">
                      {j.customer.firstName} {j.customer.lastName}
                    </p>
                    <p className="truncate text-[11px] opacity-70">{j.service.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function formatYmd(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

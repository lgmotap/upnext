import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, PageHeader, AppButton } from "@/components/app/ui";
import { SchedulerBoard, type SchedulerJobChip } from "@/components/app/SchedulerBoard";
import { formatTimeHmInTimezone, localDateTimeToUtc } from "@/lib/datetime/timezone";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { getAssignableMembers } from "@/server/repositories/team";
import { prisma } from "@/lib/db/prisma";

export default async function SchedulerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string; saved?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/calendar/scheduler");

  const params = await searchParams;
  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const todayYmd = formatYmd(new Date(), timeZone);
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayYmd;

  const dayStart = localDateTimeToUtc(date, "00:00", timeZone);
  const dayEnd = localDateTimeToUtc(date, "23:59", timeZone);

  const jobs = await prisma.job.findMany({
    where: {
      organizationId: session.organizationId,
      scheduledStartAt: { gte: dayStart, lte: dayEnd },
      status: { notIn: ["cancelled"] },
    },
    orderBy: { scheduledStartAt: "asc" },
    include: {
      customer: true,
      service: true,
      assignments: true,
    },
  });

  const workers = await getAssignableMembers(session.organizationId);
  const canEdit = canManageBookings(session);

  const chips: SchedulerJobChip[] = jobs.map((job) => {
    const timeHm = formatTimeHmInTimezone(job.scheduledStartAt, timeZone);
    const hour = Number.parseInt(timeHm.split(":")[0] ?? "9", 10);
    return {
      id: job.id,
      customerName: `${job.customer.firstName} ${job.customer.lastName}`,
      serviceName: job.service.name,
      timeHm,
      hour,
      membershipId: job.assignments[0]?.membershipId ?? null,
      status: job.status,
    };
  });

  const assigned = chips.filter((j) => j.membershipId);
  const unassigned = chips.filter((j) => !j.membershipId);

  const prevDate = shiftDate(date, -1);
  const nextDate = shiftDate(date, 1);

  return (
    <>
      <PageHeader
        title="Scheduler"
        subtitle={formatDisplayDate(date, timeZone)}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AppButton href={`/app/calendar/scheduler?date=${prevDate}`} variant="outline">
              ← Prev
            </AppButton>
            <AppButton href={`/app/calendar/scheduler?date=${todayYmd}`} variant="outline">
              Today
            </AppButton>
            <AppButton href={`/app/calendar/scheduler?date=${nextDate}`} variant="outline">
              Next →
            </AppButton>
            <AppButton href="/app/calendar" variant="ghost">
              Week calendar
            </AppButton>
          </div>
        }
      />

      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(params.error)}
        </p>
      )}
      {params.saved === "1" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Schedule updated.
        </p>
      )}

      <Card className="p-4">
        <SchedulerBoard
          date={date}
          jobs={assigned}
          workers={workers.map((w) => ({
            id: w.id,
            label: w.user.name ?? w.user.email ?? "Worker",
          }))}
          unassigned={unassigned}
          canEdit={canEdit}
        />
      </Card>

      <p className="mt-4 text-center text-sm text-ink-500">
        <Link href="/app/calendar" className="font-medium text-brand-700 hover:underline">
          Back to week view
        </Link>
      </p>
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

function shiftDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function formatDisplayDate(ymd: string, timeZone: string): string {
  const dt = localDateTimeToUtc(ymd, "12:00", timeZone);
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(dt);
}

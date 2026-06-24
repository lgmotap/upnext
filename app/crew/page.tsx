import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/app/StatusBadge";
import { formatJobSchedule, formatAddressLine } from "@/lib/datetime/calendar";
import { formatYmdInTimezone, localDateTimeToUtc, addDaysYmd } from "@/lib/datetime/timezone";
import { getAppSession } from "@/server/permissions/session";
import { listJobsAssignedToMember } from "@/server/repositories/assignments";
import { prisma } from "@/lib/db/prisma";

export default async function CrewTodayPage() {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/crew");

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const todayYmd = formatYmdInTimezone(new Date(), timeZone);
  const rangeStart = localDateTimeToUtc(todayYmd, "00:00", timeZone);
  const rangeEnd = localDateTimeToUtc(addDaysYmd(todayYmd, 1), "00:00", timeZone);

  const myJobs = await listJobsAssignedToMember(
    session.organizationId,
    session.membershipId,
    rangeStart,
    rangeEnd,
  );

  const greeting = session.name?.split(" ")[0] ?? "there";

  return (
    <div className="px-4 py-5">
      <div className="mb-4">
        <p className="text-sm text-ink-500">Good morning, {greeting}</p>
        <h1 className="text-2xl font-bold tracking-tight text-ink-950">
          {myJobs.length} job{myJobs.length === 1 ? "" : "s"} today
        </h1>
      </div>

      {myJobs.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-500 ring-1 ring-ink-100">
          No jobs assigned for today.
        </p>
      ) : (
        <div className="space-y-3">
          {myJobs.map((j) => {
            const schedule = formatJobSchedule(j.scheduledStartAt, j.scheduledEndAt, timeZone);
            const customerName = `${j.customer.firstName} ${j.customer.lastName}`;
            return (
              <Link
                key={j.id}
                href={`/crew/jobs/${j.id}`}
                className="block rounded-2xl bg-white p-4 ring-1 ring-ink-100 shadow-soft active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink-950">{schedule.shortTime}</span>
                  <StatusBadge status={j.status} />
                </div>
                <p className="mt-1 text-base font-semibold text-ink-950">{customerName}</p>
                <p className="text-sm text-ink-500">{j.service.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                    <MapPin className="size-3.5" /> {formatAddressLine(j.customerAddress)}
                  </span>
                  <ChevronRight className="size-4 text-ink-300" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

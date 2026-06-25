import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, PageHeader, Avatar, AppButton } from "@/components/app/ui";
import { ListPagination } from "@/components/app/ListPagination";
import { DEFAULT_LIST_PAGE_SIZE, parseListPage, totalPages as calcTotalPages } from "@/lib/pagination";
import { StatusBadge } from "@/components/app/StatusBadge";
import { formatMoney } from "@/lib/money/format";
import { formatJobSchedule, formatAddressLine, getDayBoundsUtc } from "@/lib/datetime/calendar";
import { formatYmdInTimezone } from "@/lib/datetime/timezone";
import { getAppSession } from "@/server/permissions/session";
import { listJobsForOrg, countJobsForOrg } from "@/server/repositories/jobs";
import { prisma } from "@/lib/db/prisma";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; date?: string; unassigned?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/jobs");

  const params = await searchParams;
  const page = parseListPage(params.page);
  const filterToday = params.date === "today";
  const filterUnassigned = params.unassigned === "1";

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";

  const listOptions: Parameters<typeof countJobsForOrg>[1] = {};
  if (filterToday) {
    const todayYmd = formatYmdInTimezone(new Date(), timeZone);
    const { start, end } = getDayBoundsUtc(todayYmd, timeZone);
    listOptions.scheduledFrom = start;
    listOptions.scheduledTo = end;
  }
  if (filterUnassigned) {
    listOptions.unassignedOnly = true;
  }

  const totalCount = await countJobsForOrg(session.organizationId, listOptions);
  const pages = calcTotalPages(totalCount, DEFAULT_LIST_PAGE_SIZE);
  const safePage = Math.min(page, pages);
  const jobs = await listJobsForOrg(session.organizationId, {
    ...listOptions,
    page: safePage,
    pageSize: DEFAULT_LIST_PAGE_SIZE,
  });

  const filterParts: string[] = [];
  if (filterToday) filterParts.push("today");
  if (filterUnassigned) filterParts.push("unassigned");
  const filterLabel = filterParts.length > 0 ? ` (${filterParts.join(", ")})` : "";

  const query = new URLSearchParams();
  if (filterToday) query.set("date", "today");
  if (filterUnassigned) query.set("unassigned", "1");

  return (
    <>
      <PageHeader
        title={`Jobs${filterLabel}`}
        subtitle={
          totalCount > 0
            ? `${totalCount} job${totalCount === 1 ? "" : "s"}${filterLabel ? " matching filters" : " total"}`
            : filterLabel
              ? "No jobs match the current filters."
              : "Every confirmed job, its schedule, status, and price."
        }
        action={
          <div className="flex flex-wrap gap-2">
            <AppButton href="/app/bookings/new">New booking</AppButton>
            <AppButton variant="outline" href="/app/bookings">
              From bookings
            </AppButton>
            {(filterToday || filterUnassigned) && (
              <AppButton variant="outline" href="/app/jobs">
                Clear filters
              </AppButton>
            )}
          </div>
        }
      />

      {jobs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">No jobs yet. Accept a booking request to schedule your first job.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.7fr] gap-3 border-b border-ink-100 px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-400 md:grid">
            <span>Customer</span>
            <span>Service</span>
            <span>When</span>
            <span>Status</span>
            <span className="text-right">Price</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {jobs.map((j) => {
              const schedule = formatJobSchedule(j.scheduledStartAt, j.scheduledEndAt, timeZone);
              const customerName = `${j.customer.firstName} ${j.customer.lastName}`;
              return (
                <li key={j.id}>
                  <Link
                    href={`/app/jobs/${j.id}`}
                    className="grid grid-cols-1 gap-2 px-5 py-3.5 hover:bg-ink-50/60 md:grid-cols-[1.6fr_1fr_0.8fr_0.8fr_0.7fr] md:items-center md:gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        initials={`${j.customer.firstName[0] ?? ""}${j.customer.lastName[0] ?? ""}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-950">{customerName}</p>
                        <p className="truncate text-xs text-ink-400">
                          {formatAddressLine(j.customerAddress)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-ink-600">{j.service.name}</span>
                    <span className="text-sm text-ink-600">
                      {schedule.date} · {schedule.shortTime}
                    </span>
                    <span>
                      <StatusBadge status={j.status} />
                    </span>
                    <span className="flex items-center justify-end">
                      <span className="text-sm font-semibold text-ink-900">
                        {formatMoney(j.priceCents, j.currency)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <ListPagination
            page={safePage}
            totalPages={pages}
            totalCount={totalCount}
            pageSize={DEFAULT_LIST_PAGE_SIZE}
            basePath="/app/jobs"
            searchParams={{
              ...(filterToday ? { date: "today" } : {}),
              ...(filterUnassigned ? { unassigned: "1" } : {}),
              ...(safePage > 1 ? { page: String(safePage) } : {}),
            }}
          />
        </Card>
      )}
    </>
  );
}

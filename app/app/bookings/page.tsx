import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { Card, PageHeader, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { ListPagination } from "@/components/app/ListPagination";
import {
  PendingBookingsSection,
  type PendingBookingCardData,
} from "@/components/app/PendingBookingsSection";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { DEFAULT_LIST_PAGE_SIZE, parseListPage, totalPages as calcTotalPages } from "@/lib/pagination";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import {
  countBookingRequestsForOrg,
  listBookingRequestsForOrg,
  type BookingDateRangeFilter,
  type BookingHistoryStatusFilter,
} from "@/server/repositories/bookings";
import { prisma } from "@/lib/db/prisma";

const PENDING_CAP = 20;

const STATUS_OPTIONS = [
  { value: "history", label: "History (not pending)" },
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending only" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
] as const;

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today (updated)" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

function parseStatus(raw: string | undefined): BookingHistoryStatusFilter {
  return STATUS_OPTIONS.some((o) => o.value === raw) ? (raw as BookingHistoryStatusFilter) : "history";
}

function parseRange(raw: string | undefined): BookingDateRangeFilter {
  return RANGE_OPTIONS.some((o) => o.value === raw) ? (raw as BookingDateRangeFilter) : "all";
}

function buildListParams(params: {
  q?: string;
  status?: BookingHistoryStatusFilter;
  range?: BookingDateRangeFilter;
  page?: number;
  pendingAll?: boolean;
}) {
  return {
    q: params.q || undefined,
    status: params.status !== "history" ? params.status : undefined,
    range: params.range !== "all" ? params.range : undefined,
    page: params.page && params.page > 1 ? String(params.page) : undefined,
    pendingAll: params.pendingAll ? "1" : undefined,
  };
}

function hrefWithParams(basePath: string, params: Record<string, string | undefined>, extra?: Record<string, string>) {
  const merged = { ...params, ...extra };
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) qs.set(key, value);
  }
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    bulkDeclined?: string;
    q?: string;
    status?: string;
    range?: string;
    page?: string;
    pendingAll?: string;
  }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/bookings");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const status = parseStatus(params.status);
  const range = parseRange(params.range);
  const historyPage = parseListPage(params.page);
  const pendingAll = params.pendingAll === "1";
  const showPending = status === "history" || status === "all" || status === "pending";
  const showHistory = status !== "pending";

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";

  const filterBase = {
    q: q || undefined,
    range: range !== "all" ? range : undefined,
    timeZone,
  };

  const [pendingCount, historyCount] = await Promise.all([
    showPending
      ? countBookingRequestsForOrg(session.organizationId, { ...filterBase, pendingOnly: true })
      : Promise.resolve(0),
    showHistory
      ? countBookingRequestsForOrg(session.organizationId, { ...filterBase, status })
      : Promise.resolve(0),
  ]);

  const historyPages = calcTotalPages(historyCount, DEFAULT_LIST_PAGE_SIZE);
  const safeHistoryPage = Math.min(historyPage, historyPages);

  const [pendingBookings, historyBookings] = await Promise.all([
    showPending && pendingCount > 0
      ? listBookingRequestsForOrg(session.organizationId, {
          ...filterBase,
          pendingOnly: true,
          page: pendingAll ? parseListPage(params.page) : 1,
          pageSize: pendingAll ? DEFAULT_LIST_PAGE_SIZE : PENDING_CAP,
        })
      : Promise.resolve([]),
    showHistory && historyCount > 0
      ? listBookingRequestsForOrg(session.organizationId, {
          ...filterBase,
          status,
          page: safeHistoryPage,
          pageSize: DEFAULT_LIST_PAGE_SIZE,
        })
      : Promise.resolve([]),
  ]);

  const canRespond = canManageBookings(session);
  const listParams = buildListParams({ q, status, range, page: safeHistoryPage, pendingAll });
  const pendingShowAllHref = hrefWithParams("/app/bookings", {
    ...listParams,
    page: undefined,
    pendingAll: "1",
  });

  const pendingCards: PendingBookingCardData[] = pendingBookings.map((b) => ({
    id: b.id,
    status: b.status,
    whenLabel: formatDisplayDateTime(b.requestedStartAt, timeZone),
    submittedLabel: formatDisplayDateTime(b.createdAt, timeZone),
    customerNotes: b.customerNotes,
    customer: {
      firstName: b.customer.firstName,
      lastName: b.customer.lastName,
      addresses: b.customer.addresses.map((a) => ({
        line1: a.line1,
        city: a.city,
        region: a.region,
        postalCode: a.postalCode,
      })),
    },
    service: { name: b.service.name },
  }));

  const empty =
    pendingCount === 0 && historyCount === 0 && !q && status === "history" && range === "all";

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle={
          pendingCount > 0
            ? `${pendingCount} pending · ${historyCount} in history`
            : "Review and respond to incoming booking requests."
        }
        action={
          canRespond ? (
            <div className="flex flex-wrap gap-2">
              <AppButton href="/app/bookings/new">New booking</AppButton>
              <AppButton variant="outline" href="/app/calendar">
                Open calendar
              </AppButton>
            </div>
          ) : (
            <AppButton variant="outline" href="/app/calendar">
              Open calendar
            </AppButton>
          )
        }
      />

      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          Permission denied.
        </p>
      )}

      {params.bulkDeclined && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-100">
          Declined {params.bulkDeclined} booking request{params.bulkDeclined === "1" ? "" : "s"}.
        </p>
      )}

      {!empty && (
        <Card className="mb-4 p-4">
          <form method="get" className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search customer name or email…"
                className="w-full rounded-xl border border-ink-200 py-2.5 pl-10 pr-3 text-sm outline-none ring-brand-500 focus:ring-2"
              />
            </div>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Status
              <select
                name="status"
                defaultValue={status}
                className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm font-medium text-ink-800"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
              Submitted
              <select
                name="range"
                defaultValue={range}
                className="rounded-xl border border-ink-200 px-3 py-2.5 text-sm font-medium text-ink-800"
              >
                {RANGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Apply
            </button>
          </form>
        </Card>
      )}

      {empty ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">No booking requests yet. Share your booking page to get started.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {showPending && pendingCount > 0 && (
            <PendingBookingsSection
              bookings={pendingCards}
              totalPending={pendingCount}
              showAllPending={pendingAll}
              pendingShowAllHref={pendingShowAllHref}
              canRespond={canRespond}
            />
          )}

          {showHistory && historyCount > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-500">
                History ({historyCount})
              </h2>
              <Card className="overflow-hidden">
                <div className="hidden grid-cols-[1.4fr_1fr_1fr_0.7fr_0.9fr] gap-3 border-b border-ink-100 px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-400 md:grid">
                  <span>Customer</span>
                  <span>Service</span>
                  <span>Requested</span>
                  <span>Status</span>
                  <span className="text-right">Submitted</span>
                </div>
                <ul className="divide-y divide-ink-100">
                  {historyBookings.map((b) => {
                    const when = formatDisplayDateTime(b.requestedStartAt, timeZone);
                    const submitted = formatDisplayDateTime(b.createdAt, timeZone);
                    return (
                      <li key={b.id}>
                        <Link
                          href={`/app/bookings/${b.id}`}
                          className="grid grid-cols-1 gap-2 px-5 py-3.5 hover:bg-ink-50/60 md:grid-cols-[1.4fr_1fr_1fr_0.7fr_0.9fr] md:items-center md:gap-3"
                        >
                          <span className="text-sm font-semibold text-ink-950">
                            {b.customer.firstName} {b.customer.lastName}
                          </span>
                          <span className="truncate text-sm text-ink-600">{b.service.name}</span>
                          <span className="text-sm text-ink-600">{when}</span>
                          <span>
                            <StatusBadge status={b.status} />
                          </span>
                          <span className="text-right text-xs text-ink-500">{submitted}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <ListPagination
                  page={safeHistoryPage}
                  totalPages={historyPages}
                  totalCount={historyCount}
                  pageSize={DEFAULT_LIST_PAGE_SIZE}
                  basePath="/app/bookings"
                  searchParams={listParams}
                />
              </Card>
            </section>
          )}

          {showHistory && historyCount === 0 && (showPending ? pendingCount === 0 : true) && (
            <Card className="p-8 text-center">
              <p className="text-sm text-ink-500">No bookings match your filters.</p>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, Phone, Search } from "lucide-react";
import { Card, PageHeader, Avatar, AppButton } from "@/components/app/ui";
import { CopyBookingLink } from "@/components/app/CopyBookingLink";
import { getBookingPageUrl } from "@/lib/url/app";
import { formatMoney } from "@/lib/money/format";
import { formatAddressLine } from "@/lib/datetime/calendar";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { getAppSession } from "@/server/permissions/session";
import { ListPagination } from "@/components/app/ListPagination";
import { DEFAULT_LIST_PAGE_SIZE, parseListPage, totalPages as calcTotalPages } from "@/lib/pagination";
import {
  countCustomersForOrg,
  getLastJobAtByCustomerIds,
  getLifetimeCentsByCustomerIds,
  listCustomerTagsForOrg,
  listCustomersForOrg,
} from "@/server/repositories/customers";
import { prisma } from "@/lib/db/prisma";

const SORT_OPTIONS = [
  { value: "recent", label: "Recently updated" },
  { value: "name", label: "Name A–Z" },
  { value: "jobs", label: "Most jobs" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function parseSort(raw: string | undefined): SortValue {
  return SORT_OPTIONS.some((o) => o.value === raw) ? (raw as SortValue) : "recent";
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; page?: string; tag?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/customers");

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const tag = params.tag?.trim().toLowerCase() ?? "";
  const sort = parseSort(params.sort);
  const page = parseListPage(params.page);

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: {
      timezone: true,
      currency: true,
      businessProfile: { select: { publicSlug: true } },
    },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const currency = org?.currency ?? "USD";
  const slug = org?.businessProfile?.publicSlug ?? "";
  const bookingUrl = slug ? getBookingPageUrl(slug) : null;

  const [totalCount, allTags] = await Promise.all([
    countCustomersForOrg(session.organizationId, q || undefined, tag || undefined),
    listCustomerTagsForOrg(session.organizationId),
  ]);
  const pages = calcTotalPages(totalCount, DEFAULT_LIST_PAGE_SIZE);
  const safePage = Math.min(page, pages);

  const customers = await listCustomersForOrg(session.organizationId, {
    q: q || undefined,
    tag: tag || undefined,
    sort,
    page: safePage,
    pageSize: DEFAULT_LIST_PAGE_SIZE,
  });

  const customerIds = customers.map((c) => c.id);
  const [lifetimeMap, lastJobMap] = await Promise.all([
    getLifetimeCentsByCustomerIds(session.organizationId, customerIds),
    getLastJobAtByCustomerIds(session.organizationId, customerIds),
  ]);

  const listParams = {
    q: q || undefined,
    tag: tag || undefined,
    sort: sort !== "recent" ? sort : undefined,
    page: safePage > 1 ? String(safePage) : undefined,
  };

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={
          totalCount > 0
            ? `${totalCount} customer${totalCount === 1 ? "" : "s"}${q ? ` matching “${q}”` : ""}`
            : "Profiles, history, and lifetime value."
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/customers/import"
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
            >
              Import CSV
            </Link>
            {bookingUrl ? (
              <CopyBookingLink url={bookingUrl} label="Share booking page" />
            ) : (
              <AppButton href="/app/settings/business">Set up booking page</AppButton>
            )}
          </div>
        }
      />

      <Card className="mb-4 p-4">
        <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Search name, email, or phone…"
              className="w-full rounded-xl bg-ink-50 py-2.5 pl-10 pr-3 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <select
            name="tag"
            defaultValue={tag}
            className="rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-ink-800 ring-1 ring-ink-200"
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-ink-800 ring-1 ring-ink-200"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-brand-400 px-4 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-600"
          >
            Apply
          </button>
          {(q || tag || sort !== "recent") && (
            <Link
              href="/app/customers"
              className="text-center text-sm font-semibold text-ink-500 hover:text-ink-900"
            >
              Clear
            </Link>
          )}
        </form>
        <p className="mt-2 text-xs text-ink-500">
          Tip: use <kbd className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd> to jump
          to any customer from anywhere in the app.
        </p>
      </Card>

      {customers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">
            {q
              ? `No customers match “${q}”. Try a different search or import a CSV.`
              : "No customers yet. They appear when someone books online."}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[1.4fr_1.1fr_0.5fr_0.8fr_0.7fr_0.8fr] gap-3 border-b border-ink-100 px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-400 md:grid">
            <span>Customer</span>
            <span>Contact</span>
            <span>Jobs</span>
            <span>Last job</span>
            <span className="text-right">Lifetime</span>
            <span className="text-right">Updated</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {customers.map((c) => {
              const name = `${c.firstName} ${c.lastName}`;
              const address = c.addresses[0];
              const lastJobAt = lastJobMap[c.id];
              return (
                <li key={c.id}>
                  <Link
                    href={`/app/customers/${c.id}`}
                    className="grid grid-cols-1 gap-2 px-5 py-3.5 hover:bg-ink-50/60 md:grid-cols-[1.4fr_1.1fr_0.5fr_0.8fr_0.7fr_0.8fr] md:items-center md:gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={`${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink-950">{name}</p>
                        <p className="truncate text-xs text-ink-400">
                          {address ? formatAddressLine(address) : "No address on file"}
                        </p>
                      </div>
                    </div>
                    <div className="min-w-0 text-sm text-ink-600">
                      <p className="flex items-center gap-1.5 truncate">
                        <Mail className="size-3.5 shrink-0 text-ink-400" />
                        <span className="truncate">{c.email}</span>
                      </p>
                      {c.phone && (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-500">
                          <Phone className="size-3.5 shrink-0 text-ink-400" />
                          {c.phone}
                        </p>
                      )}
                    </div>
                    <span className="text-sm text-ink-600">{c._count.jobs}</span>
                    <span className="text-sm text-ink-600">
                      {lastJobAt ? formatDisplayDateTime(lastJobAt, timeZone) : "—"}
                    </span>
                    <span className="text-right text-sm font-semibold text-ink-900">
                      {formatMoney(lifetimeMap[c.id] ?? 0, currency)}
                    </span>
                    <span className="text-right text-xs text-ink-500">
                      {formatDisplayDateTime(c.updatedAt, timeZone)}
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
            basePath="/app/customers"
            searchParams={listParams}
          />
        </Card>
      )}
    </>
  );
}

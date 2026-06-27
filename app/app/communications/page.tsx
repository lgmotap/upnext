import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Mail, MessageSquare } from "lucide-react";
import { Card, PageHeader } from "@/components/app/ui";
import { ListPagination } from "@/components/app/ListPagination";
import { DEFAULT_LIST_PAGE_SIZE, parseListPage, totalPages as calcTotalPages } from "@/lib/pagination";
import { templateLabel } from "@/lib/notifications/labels";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { getAppSession } from "@/server/permissions/session";
import {
  countNotificationLogsForOrg,
  listNotificationLogsForOrg,
} from "@/server/repositories/notifications";
import { prisma } from "@/lib/db/prisma";
import type { NotificationChannel } from "@/generated/prisma/client";

const CHANNELS: { value: "" | NotificationChannel; label: string }[] = [
  { value: "", label: "All channels" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

function parseChannel(raw: string | undefined): NotificationChannel | undefined {
  return raw === "email" || raw === "sms" ? raw : undefined;
}

function relatedHref(relatedType: string, relatedId: string): string | null {
  if (relatedType === "job") return `/app/jobs/${relatedId}`;
  if (relatedType === "booking" || relatedType === "booking_request") {
    return `/app/bookings/${relatedId}`;
  }
  if (relatedType === "customer") return `/app/customers/${relatedId}`;
  return null;
}

const STATUS_STYLE: Record<string, string> = {
  sent: "bg-brand-50 text-brand-800 ring-brand-100",
  failed: "bg-rose-50 text-rose-700 ring-rose-100",
  skipped: "bg-ink-50 text-ink-600 ring-ink-100",
};

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ channel?: string; page?: string; customerId?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/communications");

  const params = await searchParams;
  const channel = parseChannel(params.channel);
  const page = parseListPage(params.page);
  const customerId = params.customerId?.trim() || undefined;

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";

  let customerFilter:
    | { customerId: string; customerEmail: string; relatedIds: string[]; customerName: string }
    | undefined;

  if (customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, organizationId: session.organizationId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (!customer) notFound();

    const [jobIds, bookingIds] = await Promise.all([
      prisma.job.findMany({
        where: { organizationId: session.organizationId, customerId },
        select: { id: true },
        take: 100,
      }),
      prisma.bookingRequest.findMany({
        where: { organizationId: session.organizationId, customerId },
        select: { id: true },
        take: 100,
      }),
    ]);

    customerFilter = {
      customerId: customer.id,
      customerEmail: customer.email,
      relatedIds: [...jobIds.map((j) => j.id), ...bookingIds.map((b) => b.id)],
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
    };
  }

  const logOptions = {
    channel,
    ...(customerFilter
      ? {
          customerId: customerFilter.customerId,
          customerEmail: customerFilter.customerEmail,
          relatedIds: customerFilter.relatedIds,
        }
      : {}),
  };

  const totalCount = await countNotificationLogsForOrg(session.organizationId, logOptions);
  const pages = calcTotalPages(totalCount, DEFAULT_LIST_PAGE_SIZE);
  const safePage = Math.min(page, pages);

  const logs = await listNotificationLogsForOrg(session.organizationId, {
    page: safePage,
    pageSize: DEFAULT_LIST_PAGE_SIZE,
    ...logOptions,
  });

  const listParams = {
    channel: channel ?? undefined,
    customerId: customerFilter?.customerId,
    page: safePage > 1 ? String(safePage) : undefined,
  };

  return (
    <>
      <PageHeader
        title="Communications"
        subtitle={
          customerFilter
            ? `Messages for ${customerFilter.customerName}`
            : "Delivery log for emails and SMS sent to customers and your team."
        }
        action={
          customerFilter ? (
            <Link href="/app/communications" className="text-sm font-semibold text-brand-700 hover:underline">
              All messages
            </Link>
          ) : (
            <Link
              href="/app/settings/notifications"
              className="text-sm font-semibold text-brand-700 hover:underline"
            >
              Notification settings
            </Link>
          )
        }
      />

      <Card className="mb-4 p-4">
        <form method="get" className="flex flex-wrap items-center gap-3">
          <select
            name="channel"
            defaultValue={channel ?? ""}
            className="rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-ink-800 ring-1 ring-ink-200"
          >
            {CHANNELS.map((c) => (
              <option key={c.value || "all"} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-600"
          >
            Filter
          </button>
          {channel && (
            <Link href="/app/communications" className="text-sm font-semibold text-ink-500 hover:text-ink-900">
              Clear
            </Link>
          )}
        </form>
      </Card>

      {logs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">No messages logged yet. Sends appear here after bookings and job updates.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden grid-cols-[0.7fr_1.2fr_1fr_0.8fr_1fr_0.6fr] gap-3 border-b border-ink-100 px-5 py-3 text-xs font-bold uppercase tracking-wide text-ink-400 md:grid">
            <span>Channel</span>
            <span>Message</span>
            <span>Recipient</span>
            <span>Status</span>
            <span>Related</span>
            <span className="text-right">Sent</span>
          </div>
          <ul className="divide-y divide-ink-100">
            {logs.map((log) => {
              const href = relatedHref(log.relatedType, log.relatedId);
              return (
                <li
                  key={log.id}
                  className="grid grid-cols-1 gap-2 px-5 py-3.5 md:grid-cols-[0.7fr_1.2fr_1fr_0.8fr_1fr_0.6fr] md:items-center md:gap-3"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase text-ink-500">
                    {log.channel === "sms" ? (
                      <MessageSquare className="size-3.5" />
                    ) : (
                      <Mail className="size-3.5" />
                    )}
                    {log.channel}
                  </span>
                  <span className="text-sm font-medium text-ink-900">{templateLabel(log.template)}</span>
                  <span className="truncate text-sm text-ink-600">{log.recipientEmail}</span>
                  <span>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[log.status] ?? STATUS_STYLE.skipped}`}
                    >
                      {log.status}
                    </span>
                    {log.error && (
                      <span className="mt-1 block truncate text-[11px] text-rose-600" title={log.error}>
                        {log.error}
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-ink-600">
                    {href ? (
                      <Link href={href} className="font-medium text-brand-700 hover:underline">
                        {log.relatedType} →
                      </Link>
                    ) : (
                      <span className="text-ink-400">{log.relatedType}</span>
                    )}
                  </span>
                  <span className="text-right text-xs text-ink-500">
                    {formatDisplayDateTime(log.sentAt, timeZone)}
                  </span>
                </li>
              );
            })}
          </ul>
          <ListPagination
            page={safePage}
            totalPages={pages}
            totalCount={totalCount}
            pageSize={DEFAULT_LIST_PAGE_SIZE}
            basePath="/app/communications"
            searchParams={listParams}
          />
        </Card>
      )}
    </>
  );
}

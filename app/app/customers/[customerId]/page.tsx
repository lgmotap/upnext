import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { Card, CardHeader, StatCard, Avatar } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { CustomerDetailActions } from "@/components/app/CustomerDetailActions";
import { CustomerDetailTabs } from "@/components/app/CustomerDetailTabs";
import { parseCustomerDetailTab } from "@/lib/customers/detail-tabs";
import { CustomerTagsForm } from "@/components/app/CustomerTagsForm";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { createPrefillLink } from "@/server/services/customer-portal";
import { formatMoney } from "@/lib/money/format";
import { formatJobSchedule, formatAddressLine } from "@/lib/datetime/calendar";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { templateLabel } from "@/lib/notifications/labels";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { updateCustomerNotesAction } from "@/server/actions/customers";
import {
  getCustomerForOrg,
  getCustomerLifetimeCents,
} from "@/server/repositories/customers";
import { listJobsForCustomer } from "@/server/repositories/jobs";
import { listPaymentRecordsForCustomer } from "@/server/repositories/payments";
import { listNotificationLogsForOrg } from "@/server/repositories/notifications";
import { prisma } from "@/lib/db/prisma";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<{ error?: string; saved?: string; tab?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in");

  const { customerId } = await params;
  const query = await searchParams;
  const tab = parseCustomerDetailTab(query.tab);
  const customer = await getCustomerForOrg(session.organizationId, customerId);
  if (!customer) notFound();

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true, businessProfile: { select: { publicSlug: true } } },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const slug = org?.businessProfile?.publicSlug ?? "";
  const bookAgainHref =
    slug ? createPrefillLink(slug, customerId, session.organizationId) : "/app/bookings/new";
  const canEdit = canManageBookings(session);

  const [history, lifetimeCents, payments] = await Promise.all([
    listJobsForCustomer(session.organizationId, customerId),
    getCustomerLifetimeCents(session.organizationId, customerId),
    tab === "payments" || tab === "overview"
      ? listPaymentRecordsForCustomer(session.organizationId, customerId)
      : Promise.resolve([]),
  ]);

  const commsPreview =
    tab === "overview"
      ? await (async () => {
          const [jobIds, bookingIds] = await Promise.all([
            prisma.job.findMany({
              where: { organizationId: session.organizationId, customerId },
              select: { id: true },
              take: 50,
            }),
            prisma.bookingRequest.findMany({
              where: { organizationId: session.organizationId, customerId },
              select: { id: true },
              take: 50,
            }),
          ]);
          return listNotificationLogsForOrg(session.organizationId, {
            pageSize: 5,
            customerId,
            customerEmail: customer.email,
            relatedIds: [...jobIds.map((j) => j.id), ...bookingIds.map((b) => b.id)],
          });
        })()
      : [];

  const name = `${customer.firstName} ${customer.lastName}`;
  const defaultAddress = customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0];

  return (
    <>
      <Link
        href="/app/customers"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="size-4" /> Back to customers
      </Link>

      {query.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(query.error)}
        </p>
      )}
      {query.saved && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          {query.saved === "notes"
            ? "Notes saved."
            : query.saved === "tags"
              ? "Tags saved."
              : query.saved === "portal"
                ? "Portal sign-in link sent to customer."
                : "Address added."}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar initials={`${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`} className="size-14 text-base" />
          <div>
            <h1 className="text-2xl font-bold text-ink-950">{name}</h1>
            <p className="text-sm text-ink-500">{customer.email}</p>
          </div>
        </div>
        {tab === "overview" && (
          <CustomerDetailActions
            customerId={customerId}
            notes={customer.notes ?? ""}
            bookAgainHref={bookAgainHref}
            canEdit={canEdit}
          />
        )}
      </div>

      <CustomerDetailTabs customerId={customerId} active={tab} />

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Jobs" value={String(customer._count.jobs)} />
              <StatCard label="Lifetime value" value={formatMoney(lifetimeCents)} />
              <StatCard label="Payments" value={String(payments.length)} />
            </div>
            <Card className="p-5">
              <CustomerTagsForm customerId={customerId} tags={customer.tags} canEdit={canEdit} />
            </Card>
            {commsPreview.length > 0 && (
              <Card>
                <CardHeader
                  title="Recent messages"
                  action={
                    <Link
                      href={`/app/communications?customerId=${customerId}`}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      View all
                    </Link>
                  }
                />
                <ul className="divide-y divide-ink-100">
                  {commsPreview.map((log) => (
                    <li key={log.id} className="flex items-start gap-3 px-5 py-3 text-sm">
                      <MessageSquare className="mt-0.5 size-4 shrink-0 text-ink-400" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink-900">{templateLabel(log.template)}</p>
                        <p className="text-xs text-ink-500">
                          {log.channel} · {log.status} · {formatDisplayDateTime(log.sentAt, timeZone)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
          <Card className="h-fit">
            <CardHeader title="Contact" />
            <div className="space-y-3 p-5 text-sm text-ink-700">
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-ink-400" /> {customer.email}
              </p>
              {customer.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-ink-400" /> {customer.phone}
                </p>
              )}
              {defaultAddress && (
                <p className="flex items-start gap-2">
                  <MapPin className="size-4 shrink-0 text-ink-400" /> {formatAddressLine(defaultAddress)}
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {tab === "jobs" && (
        <Card>
          <CardHeader title="Job history" />
          <ul className="divide-y divide-ink-100">
            {history.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-ink-400">No jobs yet.</li>
            )}
            {history.map((j) => {
              const schedule = formatJobSchedule(j.scheduledStartAt, j.scheduledEndAt, timeZone);
              return (
                <li key={j.id}>
                  <Link
                    href={`/app/jobs/${j.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-950">{j.service.name}</p>
                      <p className="text-xs text-ink-500">
                        {schedule.date} · {schedule.shortTime}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-ink-900">
                      {formatMoney(j.priceCents, j.currency)}
                    </span>
                    <StatusBadge status={j.status} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {tab === "addresses" && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink-950">Addresses</h2>
            {canEdit && (
              <CustomerDetailActions
                customerId={customerId}
                notes=""
                bookAgainHref={bookAgainHref}
                canEdit={canEdit}
                variant="address-only"
              />
            )}
          </div>
          {customer.addresses.length === 0 ? (
            <p className="text-sm text-ink-500">No addresses on file.</p>
          ) : (
            <ul className="divide-y divide-ink-100 rounded-xl ring-1 ring-ink-100">
              {customer.addresses.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm text-ink-700">
                  <p className="font-medium text-ink-900">{formatAddressLine(a)}</p>
                  {a.notes && <p className="mt-1 text-xs text-ink-500">{a.notes}</p>}
                  {a.isDefault && (
                    <span className="mt-1 inline-block rounded bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-800">
                      Default
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "notes" && (
        <Card className="p-5">
          {canEdit ? (
            <form action={updateCustomerNotesAction} className="space-y-4">
              <input type="hidden" name="customerId" value={customerId} />
              <input type="hidden" name="tab" value="notes" />
              <label htmlFor="notes" className="block text-sm font-bold text-ink-950">
                Customer notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={8}
                defaultValue={customer.notes ?? ""}
                placeholder="Gate codes, pets, preferences…"
                className={input}
              />
              <FormSubmitButton loadingLabel="Saving…">Save notes</FormSubmitButton>
            </form>
          ) : (
            <p className="text-sm text-ink-600 whitespace-pre-wrap">{customer.notes || "No notes."}</p>
          )}
        </Card>
      )}

      {tab === "payments" && (
        <Card>
          <CardHeader title="Payments" />
          <ul className="divide-y divide-ink-100">
            {payments.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-ink-400">No payment records yet.</li>
            )}
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm">
                <span className="font-semibold text-ink-900">{formatMoney(p.amountCents, p.currency)}</span>
                <StatusBadge status={p.status} />
                {p.job && (
                  <Link href={`/app/jobs/${p.job.id}`} className="text-brand-700 hover:underline">
                    {p.job.title}
                  </Link>
                )}
                <span className="ml-auto text-xs text-ink-500">
                  {formatDisplayDateTime(p.paidAt ?? p.createdAt, timeZone)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

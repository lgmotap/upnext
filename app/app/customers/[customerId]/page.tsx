import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { Card, CardHeader, StatCard, Avatar } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { formatMoney } from "@/lib/money/format";
import { formatJobSchedule, formatAddressLine } from "@/lib/datetime/calendar";
import { getAppSession } from "@/server/permissions/session";
import {
  getCustomerForOrg,
  getCustomerLifetimeCents,
} from "@/server/repositories/customers";
import { listJobsForCustomer } from "@/server/repositories/jobs";
import { prisma } from "@/lib/db/prisma";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in");

  const { customerId } = await params;
  const customer = await getCustomerForOrg(session.organizationId, customerId);
  if (!customer) notFound();

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";

  const [history, lifetimeCents] = await Promise.all([
    listJobsForCustomer(session.organizationId, customerId),
    getCustomerLifetimeCents(session.organizationId, customerId),
  ]);

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

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar initials={`${customer.firstName[0] ?? ""}${customer.lastName[0] ?? ""}`} className="size-14 text-base" />
          <div>
            <h1 className="text-2xl font-bold text-ink-950">{name}</h1>
            <p className="text-sm text-ink-500">{customer.email}</p>
            {customer.tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {customer.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Jobs" value={String(customer._count.jobs)} />
            <StatCard label="Lifetime value" value={formatMoney(lifetimeCents)} />
            <StatCard label="Status" value="Active" />
          </div>

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
            {customer.notes && <p className="text-xs text-ink-500">{customer.notes}</p>}
          </div>
        </Card>
      </div>
    </>
  );
}

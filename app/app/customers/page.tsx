import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, Phone } from "lucide-react";
import { Card, PageHeader, Avatar, AppButton } from "@/components/app/ui";
import { CopyBookingLink } from "@/components/app/CopyBookingLink";
import { getBookingPageUrl } from "@/lib/url/app";
import { formatMoney } from "@/lib/money/format";
import { formatAddressLine } from "@/lib/datetime/calendar";
import { getAppSession } from "@/server/permissions/session";
import { listCustomersForOrg, getCustomerLifetimeCents } from "@/server/repositories/customers";
import { prisma } from "@/lib/db/prisma";

export default async function CustomersPage() {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/customers");

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { businessProfile: { select: { publicSlug: true } } },
  });
  const slug = org?.businessProfile?.publicSlug ?? "";
  const bookingUrl = slug ? getBookingPageUrl(slug) : null;

  const customers = await listCustomersForOrg(session.organizationId);
  const lifetimeByCustomer = await Promise.all(
    customers.map(async (c) => ({
      id: c.id,
      cents: await getCustomerLifetimeCents(session.organizationId, c.id),
    })),
  );
  const lifetimeMap = Object.fromEntries(lifetimeByCustomer.map((x) => [x.id, x.cents]));

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Profiles, history, and lifetime value."
        action={
          bookingUrl ? (
            <CopyBookingLink url={bookingUrl} label="Share booking page" />
          ) : (
            <AppButton href="/app/settings/business">Set up booking page</AppButton>
          )
        }
      />

      {customers.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">No customers yet. They appear when someone books online.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => {
            const name = `${c.firstName} ${c.lastName}`;
            const address = c.addresses[0];
            return (
              <Link key={c.id} href={`/app/customers/${c.id}`}>
                <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
                  <div className="flex items-center gap-3">
                    <Avatar initials={`${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`} className="size-10" />
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink-950">{name}</p>
                      <p className="truncate text-xs text-ink-500">
                        {address ? formatAddressLine(address) : c.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1 text-xs text-ink-500">
                    <p className="flex items-center gap-1.5">
                      <Mail className="size-3.5" /> {c.email}
                    </p>
                    {c.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="size-3.5" /> {c.phone}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                    <span className="text-xs text-ink-500">{c._count.jobs} jobs</span>
                    <span className="text-sm font-bold text-ink-950">
                      {formatMoney(lifetimeMap[c.id] ?? 0)}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

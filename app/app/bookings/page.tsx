import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { Card, PageHeader, AppButton } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { BookingListActions } from "@/components/app/BookingListActions";
import { formatDisplayDateTime } from "@/lib/datetime/timezone";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { listBookingRequestsForOrg } from "@/server/repositories/bookings";
import { prisma } from "@/lib/db/prisma";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/bookings");

  const params = await searchParams;
  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";

  const bookings = await listBookingRequestsForOrg(session.organizationId);
  const canRespond = canManageBookings(session);

  return (
    <>
      <PageHeader
        title="Bookings"
        subtitle="Review and respond to incoming booking requests."
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

      {bookings.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">No booking requests yet. Share your booking page to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const address = b.customer.addresses?.[0];
            const addressLine = address
              ? `${address.line1}, ${address.city}, ${address.region} ${address.postalCode}`
              : "—";
            const when = formatDisplayDateTime(b.requestedStartAt, timeZone);
            const submitted = formatDisplayDateTime(b.createdAt, timeZone);

            return (
              <Card key={b.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/app/bookings/${b.id}`}
                        className="text-base font-bold text-ink-950 hover:text-brand-700"
                      >
                        {b.customer.firstName} {b.customer.lastName}
                      </Link>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-ink-600">
                      <span className="font-medium text-ink-800">{b.service.name}</span>
                      <span className="inline-flex items-center gap-1 text-ink-500">
                        <Clock className="size-3.5" /> {when}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-ink-400">{addressLine}</p>
                    {b.customerNotes && (
                      <p className="mt-2 rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-600">
                        &ldquo;{b.customerNotes}&rdquo;
                      </p>
                    )}
                  </div>

                  {b.status === "pending" && canRespond && (
                    <div className="flex items-center gap-2">
                      <BookingListActions bookingRequestId={b.id} />
                    </div>
                  )}
                  <span className="self-center text-xs text-ink-400">Submitted {submitted}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

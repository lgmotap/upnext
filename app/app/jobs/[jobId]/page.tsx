import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Clock, Wrench, CreditCard, ExternalLink } from "lucide-react";
import { Card, CardHeader } from "@/components/app/ui";
import { StatusBadge } from "@/components/app/StatusBadge";
import { formatMoney } from "@/lib/money/format";
import { formatJobSchedule, formatAddressLine } from "@/lib/datetime/calendar";
import { formatTimeHmInTimezone, formatYmdInTimezone } from "@/lib/datetime/timezone";
import { getRescheduleDaysForJob, getRescheduleSlotsForJob } from "@/server/services/scheduling";
import { formatElapsedDuration } from "@/lib/datetime/duration";
import { JobDetailActions } from "@/components/app/JobDetailActions";
import type { BookableDay } from "@/lib/availability/calendar-ui";
import { JobChecklist } from "@/components/crew/JobChecklist";
import { JobPhotoGallery } from "@/components/crew/JobPhotos";
import { getJobPhotosWithUrls } from "@/server/services/job-photos";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { getJobForOrg } from "@/server/repositories/jobs";
import { markJobPaymentOverdueAction, markJobPaymentPaidAction, requestJobPaymentLinkAction } from "@/server/actions/payments";
import { getAssignableMembers } from "@/server/repositories/team";
import { canAssignJobs } from "@/server/permissions/job-access";
import { isStripeConfigured } from "@/server/services/payments";
import { prisma } from "@/lib/db/prisma";
import { JobSeriesPanel } from "@/components/app/JobSeriesPanel";
import { formatJobServicesLine } from "@/lib/jobs/service-line";
import { getJobSeriesByAnchorJob } from "@/server/repositories/job-series";
import { listBookingFormFields } from "@/server/repositories/booking-form-fields";
import { CustomFieldsDisplay } from "@/components/app/CustomFieldsDisplay";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ error?: string; payment?: string; cancelled?: string; rescheduled?: string; series?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in");

  const { jobId } = await params;
  const query = await searchParams;
  const job = await getJobForOrg(session.organizationId, jobId);
  if (!job) notFound();

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true, stripeConnectChargesEnabled: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const schedule = formatJobSchedule(job.scheduledStartAt, job.scheduledEndAt, timeZone);
  const customerName = `${job.customer.firstName} ${job.customer.lastName}`;
  const address = job.customerAddress ?? job.customer.addresses[0];
  const canEdit = canManageBookings(session);
  const canAssign = canAssignJobs(session);
  const assignable = canAssign ? await getAssignableMembers(session.organizationId) : [];
  const assignableOptions = assignable.map((m) => ({
    id: m.id,
    label: `${m.user.name ?? m.user.email} (${m.role})`,
  }));
  const assignee = job.assignments[0]?.membership;
  const payment = job.paymentRecord;
  const stripeReady = isStripeConfigured() && Boolean(org?.stripeConnectChargesEnabled);
  const photos = await getJobPhotosWithUrls(session.organizationId, jobId);
  const series = job.jobSeries ?? (await getJobSeriesByAnchorJob(session.organizationId, jobId));
  const formFields = job.bookingRequest?.customFieldsJson
    ? await listBookingFormFields(session.organizationId)
    : [];
  const addonNames = job.bookingRequest?.addons.map((a) => a.name) ?? [];
  const servicesLine = formatJobServicesLine(job.service.name, addonNames);

  let reschedule:
    | {
        timeZone: string;
        initialDays: BookableDay[];
        initialSlots: { date: string; time: string; label: string }[];
        initialDate: string;
        initialTime: string;
      }
    | undefined;

  if (canEdit && job.status !== "completed" && job.status !== "cancelled") {
    const initialDate = formatYmdInTimezone(job.scheduledStartAt, timeZone);
    const currentTime = formatTimeHmInTimezone(job.scheduledStartAt, timeZone);
    const daysResult = await getRescheduleDaysForJob(session.organizationId, jobId);
    const slotRows = (await getRescheduleSlotsForJob(session.organizationId, jobId, initialDate)) ?? [];
    const initialSlots = slotRows.map((s) => ({
      date: s.date,
      time: s.time,
      label: formatTime12h(s.time),
    }));
    reschedule = {
      timeZone,
      initialDays: daysResult?.days ?? [],
      initialSlots,
      initialDate,
      initialTime:
        initialSlots.find((s) => s.time === currentTime)?.time ?? initialSlots[0]?.time ?? currentTime,
    };
  }

  return (
    <>
      <Link
        href="/app/jobs"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="size-4" /> Back to jobs
      </Link>

      {query.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(query.error)}
        </p>
      )}
      {query.payment === "success" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Payment received — status will update when Stripe confirms (usually instant).
        </p>
      )}
      {query.payment === "paid" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Marked as paid manually.
        </p>
      )}

      {query.cancelled === "1" && (
        <p className="mb-4 rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700 ring-1 ring-ink-200">
          Job cancelled.
        </p>
      )}

      {query.rescheduled === "1" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Job rescheduled. The customer was notified by email.
        </p>
      )}
      {query.series === "paused" && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">
          Recurring schedule paused.
        </p>
      )}
      {query.series === "resumed" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Recurring schedule resumed.
        </p>
      )}
      {query.series === "cancelled" && (
        <p className="mb-4 rounded-xl bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700 ring-1 ring-ink-200">
          Recurring schedule cancelled.
        </p>
      )}

      {series && (
        <div className="mb-4">
          <JobSeriesPanel
            seriesId={series.id}
            jobId={job.id}
            frequency={series.frequency}
            status={series.status}
            nextOccurrenceAt={series.nextOccurrenceAt}
            timeZone={timeZone}
            canEdit={canEdit}
          />
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-ink-950">{customerName}</h1>
            <StatusBadge status={job.status} />
            {payment && <StatusBadge status={payment.status} />}
          </div>
          <p className="mt-1 text-sm text-ink-500">
            {servicesLine} · {schedule.date} at {schedule.shortTime}
          </p>
        </div>
        <JobDetailActions
          jobId={job.id}
          status={job.status}
          canEdit={canEdit}
          canAssign={canAssign}
          assignable={assignableOptions}
          currentAssigneeId={assignee?.id}
          reschedule={reschedule}
        />
      </div>

      <Card>
        <CardHeader title="Details" />
        <dl className="grid gap-3 p-5 sm:grid-cols-2">
          <Detail icon={MapPin} label="Address" value={formatAddressLine(address)} />
          <Detail icon={Clock} label="Scheduled" value={`${schedule.date} · ${schedule.time}`} />
          {job.checkedInAt && (
            <Detail
              icon={Clock}
              label="Checked in"
              value={
                job.completedAt
                  ? `${formatElapsedDuration(job.completedAt.getTime() - job.checkedInAt.getTime())} on site`
                  : "In progress"
              }
            />
          )}
          <Detail icon={Wrench} label="Service" value={servicesLine} />
          <Detail icon={Clock} label="Price" value={formatMoney(job.priceCents, job.currency)} />
        </dl>
        {job.customerNotes && (
          <p className="border-t border-ink-100 px-5 py-4 text-sm text-ink-600">
            Customer note: {job.customerNotes}
          </p>
        )}
        {job.bookingRequest?.customFieldsJson && (
          <div className="border-t border-ink-100 px-5 py-4">
            <CustomFieldsDisplay
              fields={formFields}
              values={job.bookingRequest.customFieldsJson as Record<string, unknown>}
            />
          </div>
        )}
      </Card>

      <JobChecklist jobId={job.id} items={job.checklistItems} readOnly />

      <JobPhotoGallery photos={photos} title="Photos" />

      <Card className="mt-4">
        <CardHeader title="Assigned" />
        <div className="p-5">
          {assignee ? (
            <p className="text-sm font-semibold text-ink-900">
              {assignee.user.name ?? assignee.user.email}
              <span className="ml-2 text-xs font-normal capitalize text-ink-500">{assignee.role}</span>
            </p>
          ) : (
            <p className="text-sm text-ink-500">
              No one assigned yet.{canAssign && assignable.length > 0 ? " Use Assign above." : ""}
            </p>
          )}
        </div>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Payment" />
        <div className="space-y-4 p-5">
          {payment ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold text-ink-950">
                    {formatMoney(payment.amountCents, payment.currency)}
                  </p>
                  <p className="mt-1 flex items-center gap-2 text-sm text-ink-500">
                    <CreditCard className="size-4" />
                    {payment.provider === "stripe" ? "Stripe Checkout" : "Manual tracking"}
                  </p>
                </div>
                <StatusBadge status={payment.status} />
              </div>

              {payment.paymentUrl && payment.status === "pending" && (
                <a
                  href={payment.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                >
                  Open payment link <ExternalLink className="size-3.5" />
                </a>
              )}

              {canEdit && payment.status !== "paid" && (
                <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
                  {stripeReady && (
                    <form action={requestJobPaymentLinkAction}>
                      <input type="hidden" name="jobId" value={job.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-600"
                      >
                        {payment.paymentUrl ? "Regenerate payment link" : "Send payment link"}
                      </button>
                    </form>
                  )}
                  <form action={markJobPaymentPaidAction}>
                    <input type="hidden" name="jobId" value={job.id} />
                    <button
                      type="submit"
                      className="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100"
                    >
                      Mark paid (manual)
                    </button>
                  </form>
                  {payment.status === "pending" && (
                    <form action={markJobPaymentOverdueAction}>
                      <input type="hidden" name="jobId" value={job.id} />
                      <button
                        type="submit"
                        className="rounded-full px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                      >
                        Mark overdue
                      </button>
                    </form>
                  )}
                </div>
              )}

              {!stripeReady && canEdit && payment.status !== "paid" && (
                <p className="text-xs text-ink-400">
                  Connect Stripe in{" "}
                  <Link href="/app/settings/billing" className="font-semibold text-brand-700 hover:underline">
                    Settings → Billing
                  </Link>{" "}
                  to send Checkout links, or use mark paid for cash/check.
                </p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-ink-500">
                {formatMoney(job.priceCents, job.currency)} · not yet invoiced
              </p>
              {canEdit && stripeReady && (
                <form action={requestJobPaymentLinkAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <button
                    type="submit"
                    className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-600"
                  >
                    Send payment link
                  </button>
                </form>
              )}
              {canEdit && !stripeReady && (
                <p className="text-xs text-ink-400">
                  Connect Stripe in{" "}
                  <Link href="/app/settings/billing" className="font-semibold text-brand-700 hover:underline">
                    Settings → Billing
                  </Link>{" "}
                  to send Checkout links.
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </>
  );
}

function formatTime12h(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        <Icon className="size-3.5" />
      </span>
      <div>
        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</dt>
        <dd className="text-sm font-medium text-ink-900">{value}</dd>
      </div>
    </div>
  );
}

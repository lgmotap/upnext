import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Check, Navigation, LogIn } from "lucide-react";
import { StatusBadge } from "@/components/app/StatusBadge";
import { CheckInTimer } from "@/components/crew/CheckInTimer";
import { JobChecklist } from "@/components/crew/JobChecklist";
import { formatJobSchedule, formatAddressLine } from "@/lib/datetime/calendar";
import { getAppSession } from "@/server/permissions/session";
import { getJobForOrg } from "@/server/repositories/jobs";
import { requireJobAccess } from "@/server/permissions/job-access";
import { JobPhotoGallery, JobPhotoUpload } from "@/components/crew/JobPhotos";
import { MAX_JOB_PHOTOS } from "@/lib/storage/job-photos";
import { getJobPhotosWithUrls } from "@/server/services/job-photos";
import { ensureJobChecklistItems } from "@/server/services/checklists";
import { CrewStatusActions } from "@/components/crew/CrewStatusActions";
import {
  markJobCompleteCrewAction,
  markJobInProgressAction,
  checkInJobAction,
} from "@/server/actions/jobs";
import { prisma } from "@/lib/db/prisma";

export default async function CrewJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/crew");

  const { jobId } = await params;
  const query = await searchParams;
  if (!(await requireJobAccess(session, jobId))) notFound();

  const job = await getJobForOrg(session.organizationId, jobId);
  if (!job) notFound();

  await ensureJobChecklistItems(session.organizationId, jobId);
  const [jobWithChecklist, photos] = await Promise.all([
    getJobForOrg(session.organizationId, jobId),
    getJobPhotosWithUrls(session.organizationId, jobId),
  ]);
  if (!jobWithChecklist) notFound();

  const org = await prisma.organization.findUnique({
    where: { id: session.organizationId },
    select: { timezone: true },
  });
  const timeZone = org?.timezone ?? "America/New_York";
  const schedule = formatJobSchedule(jobWithChecklist.scheduledStartAt, jobWithChecklist.scheduledEndAt, timeZone);
  const customerName = `${jobWithChecklist.customer.firstName} ${jobWithChecklist.customer.lastName}`;
  const address = jobWithChecklist.customerAddress ?? jobWithChecklist.customer.addresses[0];

  return (
    <div className="px-4 py-5">
      <Link
        href="/crew"
        className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-ink-500"
      >
        <ArrowLeft className="size-4" /> Today
      </Link>

      {query.status === "on_the_way" && (
        <p className="mb-3 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Customer notified — you&apos;re on the way.
        </p>
      )}
      {query.status === "running_late" && (
        <p className="mb-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">
          Customer notified that you&apos;re running late.
        </p>
      )}

      <div className="rounded-2xl bg-white p-4 ring-1 ring-ink-100 shadow-soft">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-ink-950">{schedule.shortTime}</span>
          <StatusBadge status={jobWithChecklist.status} />
        </div>
        <h1 className="mt-1 text-xl font-bold text-ink-950">{customerName}</h1>
        <p className="text-sm text-ink-500">{jobWithChecklist.service.name}</p>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-700">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-ink-400" /> {formatAddressLine(address)}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
            <Navigation className="size-3.5" /> Directions
          </span>
        </div>
        {jobWithChecklist.customerNotes && (
          <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-ink-700">{jobWithChecklist.customerNotes}</p>
        )}
      </div>

      {jobWithChecklist.checkedInAt && (
        <CheckInTimer
          checkedInAt={jobWithChecklist.checkedInAt.toISOString()}
          completedAt={jobWithChecklist.completedAt?.toISOString()}
        />
      )}

      <JobChecklist jobId={jobWithChecklist.id} items={jobWithChecklist.checklistItems} />

      <JobPhotoGallery photos={photos} />
      {jobWithChecklist.status !== "completed" && jobWithChecklist.status !== "cancelled" && (
        <JobPhotoUpload
          jobId={jobWithChecklist.id}
          photoCount={photos.length}
          maxPhotos={MAX_JOB_PHOTOS}
        />
      )}

      {jobWithChecklist.status !== "completed" && jobWithChecklist.status !== "cancelled" && (
        <div className="mt-4 space-y-2">
          {jobWithChecklist.status === "scheduled" && (
            <form action={markJobInProgressAction}>
              <input type="hidden" name="jobId" value={jobWithChecklist.id} />
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold ring-1 ring-ink-200 text-ink-800"
              >
                Start job
              </button>
            </form>
          )}
          {jobWithChecklist.status === "in_progress" && !jobWithChecklist.checkedInAt && (
            <form action={checkInJobAction}>
              <input type="hidden" name="jobId" value={jobWithChecklist.id} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-3 text-sm font-bold text-brand-950"
              >
                <LogIn className="size-4" /> Check in
              </button>
            </form>
          )}
          <form action={markJobCompleteCrewAction}>
            <input type="hidden" name="jobId" value={jobWithChecklist.id} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-4 text-base font-bold text-brand-950"
            >
              <Check className="size-5" /> Mark job complete
            </button>
          </form>
        </div>
      )}

      <CrewStatusActions jobId={jobWithChecklist.id} status={jobWithChecklist.status} />

      <div className="h-6" />
    </div>
  );
}

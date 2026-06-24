"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canCompleteAssignedJob } from "@/server/permissions/can";
import { updateJobStatus, checkInToJob } from "@/server/services/jobs";
import { assignJobToMember } from "@/server/repositories/assignments";
import { notifyJobAssigned } from "@/server/services/notifications";
import { canAssignJobs, requireJobAccess } from "@/server/permissions/job-access";

export async function markJobCompleteAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canCompleteAssignedJob(session)) redirect("/app/jobs?error=denied");

  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) redirect("/app/jobs");

  if (!(await requireJobAccess(session, jobId))) redirect("/app/jobs?error=denied");

  await updateJobStatus(session.organizationId, jobId, "completed");
  revalidatePath("/app/jobs");
  revalidatePath(`/app/jobs/${jobId}`);
  revalidatePath("/app/calendar");
  revalidatePath("/crew");

  const returnTo = String(formData.get("returnTo") ?? "");
  redirect(returnTo === "crew" ? `/crew/jobs/${jobId}` : `/app/jobs/${jobId}`);
}

export async function markJobCompleteCrewAction(formData: FormData): Promise<void> {
  const fd = new FormData();
  fd.set("jobId", String(formData.get("jobId") ?? ""));
  fd.set("returnTo", "crew");
  return markJobCompleteAction(fd);
}

export async function markJobInProgressAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canCompleteAssignedJob(session)) return;

  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;

  if (!(await requireJobAccess(session, jobId))) return;

  await updateJobStatus(session.organizationId, jobId, "in_progress");
  revalidatePath("/app/jobs");
  revalidatePath(`/app/jobs/${jobId}`);
  revalidatePath("/app/calendar");
  revalidatePath("/crew");
}

export async function checkInJobAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canCompleteAssignedJob(session)) return;

  const jobId = String(formData.get("jobId") ?? "");
  if (!jobId) return;

  if (!(await requireJobAccess(session, jobId))) return;

  await checkInToJob(session.organizationId, jobId);
  revalidatePath("/app/jobs");
  revalidatePath(`/app/jobs/${jobId}`);
  revalidatePath("/crew");
  revalidatePath(`/crew/jobs/${jobId}`);
}

export async function assignJobAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canAssignJobs(session)) redirect("/app/jobs?error=denied");

  const jobId = String(formData.get("jobId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");
  if (!jobId || !membershipId) redirect(`/app/jobs/${jobId}`);

  await assignJobToMember(jobId, membershipId, session.organizationId);
  await notifyJobAssigned(session.organizationId, jobId, membershipId);
  revalidatePath(`/app/jobs/${jobId}`);
  revalidatePath("/crew");
  redirect(`/app/jobs/${jobId}`);
}

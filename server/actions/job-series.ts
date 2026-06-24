"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import {
  pauseJobSeries,
  resumeJobSeries,
  cancelJobSeries,
} from "@/server/services/recurring-jobs";

async function guard(seriesId: string, jobId: string) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in");
  if (!canManageBookings(session)) {
    redirect(`/app/jobs/${jobId}?error=${encodeURIComponent("Permission denied")}`);
  }
  return session;
}

export async function pauseJobSeriesAction(formData: FormData): Promise<void> {
  const seriesId = String(formData.get("seriesId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  const session = await guard(seriesId, jobId);
  const ok = await pauseJobSeries(session.organizationId, seriesId);
  if (!ok) {
    redirect(`/app/jobs/${jobId}?error=${encodeURIComponent("Could not pause series")}`);
  }
  revalidatePath(`/app/jobs/${jobId}`);
  redirect(`/app/jobs/${jobId}?series=paused`);
}

export async function resumeJobSeriesAction(formData: FormData): Promise<void> {
  const seriesId = String(formData.get("seriesId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  const session = await guard(seriesId, jobId);
  const ok = await resumeJobSeries(session.organizationId, seriesId);
  if (!ok) {
    redirect(`/app/jobs/${jobId}?error=${encodeURIComponent("Could not resume series")}`);
  }
  revalidatePath(`/app/jobs/${jobId}`);
  redirect(`/app/jobs/${jobId}?series=resumed`);
}

export async function cancelJobSeriesAction(formData: FormData): Promise<void> {
  const seriesId = String(formData.get("seriesId") ?? "");
  const jobId = String(formData.get("jobId") ?? "");
  const session = await guard(seriesId, jobId);
  const ok = await cancelJobSeries(session.organizationId, seriesId);
  if (!ok) {
    redirect(`/app/jobs/${jobId}?error=${encodeURIComponent("Could not cancel series")}`);
  }
  revalidatePath(`/app/jobs/${jobId}`);
  redirect(`/app/jobs/${jobId}?series=cancelled`);
}

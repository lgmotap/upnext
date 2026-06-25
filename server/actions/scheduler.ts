"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageBookings } from "@/server/permissions/can";
import { rescheduleJob } from "@/server/services/scheduling";

export async function rescheduleJobFromSchedulerAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageBookings(session)) {
    redirect("/app/calendar/scheduler?error=denied");
  }

  const jobId = String(formData.get("jobId") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const membershipIdRaw = String(formData.get("membershipId") ?? "");
  const membershipId = membershipIdRaw && membershipIdRaw !== "unassigned" ? membershipIdRaw : undefined;

  if (!jobId || !date || !time) {
    redirect("/app/calendar/scheduler?error=invalid");
  }

  const result = await rescheduleJob(session.organizationId, jobId, date, time, membershipId);
  if (!result.ok) {
    redirect(`/app/calendar/scheduler?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/app/calendar/scheduler");
  revalidatePath("/app/calendar");
  revalidatePath("/app/jobs");
  redirect("/app/calendar/scheduler?saved=1");
}

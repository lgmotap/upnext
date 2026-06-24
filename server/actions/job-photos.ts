"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/server/permissions/session";
import { canCompleteAssignedJob } from "@/server/permissions/can";
import { requireJobAccess } from "@/server/permissions/job-access";
import { uploadJobPhoto } from "@/server/services/job-photos";
import { uploadJobPhotoSchema } from "@/server/validators/job-photo";

export async function uploadJobPhotoAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canCompleteAssignedJob(session)) return;

  const parsed = uploadJobPhotoSchema.safeParse({
    jobId: formData.get("jobId"),
    type: formData.get("type") ?? "proof",
    caption: formData.get("caption") || undefined,
  });
  if (!parsed.success) return;

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return;

  const { jobId, type, caption } = parsed.data;
  if (!(await requireJobAccess(session, jobId))) return;

  await uploadJobPhoto(session.organizationId, jobId, session.membershipId, file, type, caption);

  revalidatePath(`/crew/jobs/${jobId}`);
  revalidatePath(`/app/jobs/${jobId}`);
}

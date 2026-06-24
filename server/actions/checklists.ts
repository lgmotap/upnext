"use server";

import { revalidatePath } from "next/cache";
import { getAppSession } from "@/server/permissions/session";
import { canCompleteAssignedJob } from "@/server/permissions/can";
import { requireJobAccess } from "@/server/permissions/job-access";
import { setJobChecklistItemCompleted } from "@/server/services/checklists";
import { toggleChecklistItemSchema } from "@/server/validators/checklist";

export async function toggleJobChecklistItemAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canCompleteAssignedJob(session)) return;

  const parsed = toggleChecklistItemSchema.safeParse({
    jobId: formData.get("jobId"),
    itemId: formData.get("itemId"),
    completed: formData.get("completed"),
  });
  if (!parsed.success) return;

  const { jobId, itemId, completed } = parsed.data;
  if (!(await requireJobAccess(session, jobId))) return;

  await setJobChecklistItemCompleted(
    session.organizationId,
    jobId,
    itemId,
    session.membershipId,
    completed === "true",
  );

  revalidatePath(`/crew/jobs/${jobId}`);
  revalidatePath(`/app/jobs/${jobId}`);
}

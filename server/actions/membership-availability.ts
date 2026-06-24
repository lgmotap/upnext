"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageTeam } from "@/server/permissions/can";
import { availabilityRuleSchema } from "@/server/validators/availability";
import {
  getMembershipForOrg,
  saveMembershipWeeklyAvailability,
} from "@/server/repositories/membership-availability";

function availabilityRedirect(membershipId: string, params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(
    qs
      ? `/app/team/${membershipId}/availability?${qs}`
      : `/app/team/${membershipId}/availability`,
  );
}

export async function saveMembershipAvailabilityAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageTeam(session)) {
    redirect("/app/team?error=Permission%20denied");
  }

  const membershipId = String(formData.get("membershipId") ?? "");
  const member = await getMembershipForOrg(session.organizationId, membershipId);
  if (!member) {
    redirect("/app/team?error=Team%20member%20not%20found");
  }

  const rules = [];
  for (let day = 0; day < 7; day++) {
    const parsed = availabilityRuleSchema.safeParse({
      dayOfWeek: day,
      startTime: formData.get(`startTime_${day}`),
      endTime: formData.get(`endTime_${day}`),
      isActive: formData.get(`isActive_${day}`) === "on",
    });
    if (!parsed.success) {
      availabilityRedirect(membershipId, { error: `Invalid hours for day ${day}` });
    }
    rules.push(parsed.data);
  }

  await saveMembershipWeeklyAvailability(membershipId, rules);
  revalidatePath(`/app/team/${membershipId}/availability`);
  revalidatePath("/app/team");
  revalidatePath("/app/bookings/new");
  revalidatePath("/crew");
  availabilityRedirect(membershipId, { saved: "1" });
}

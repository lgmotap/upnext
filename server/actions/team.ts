"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAppSession } from "@/server/permissions/session";
import { canManageTeam } from "@/server/permissions/can";
import { createTeamInvite, acceptTeamInvite } from "@/server/services/team-invites";
import { inviteTeamMemberSchema } from "@/server/validators/team";

export async function inviteTeamMemberAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session || !canManageTeam(session)) {
    redirect("/app/team?error=Permission%20denied");
  }

  const parsed = inviteTeamMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") ?? "worker",
  });
  if (!parsed.success) {
    const msg = Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input";
    redirect(`/app/team?error=${encodeURIComponent(msg)}`);
  }

  const result = await createTeamInvite(
    session.organizationId,
    session.membershipId,
    parsed.data.email,
    parsed.data.role,
  );

  if (!result.ok) {
    redirect(`/app/team?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/app/team");
  redirect("/app/team?invited=1");
}

export async function acceptTeamInviteAction(formData: FormData): Promise<void> {
  const session = await getAppSession();
  if (!session) {
    redirect(`/sign-in?next=${encodeURIComponent(String(formData.get("returnTo") ?? "/crew"))}`);
  }

  const token = String(formData.get("token") ?? "");
  if (!token) redirect("/sign-in");

  const result = await acceptTeamInvite(token, session.userId, session.email);
  if (!result.ok) {
    redirect(`/accept-invite/${token}?error=${encodeURIComponent(result.error)}`);
  }

  redirect(result.organizationId && session.role === "worker" ? "/crew" : "/crew");
}

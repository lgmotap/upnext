import { redirect } from "next/navigation";

/** Member "profile" for MVP is worker hours only — redirect to availability editor. */
export default async function TeamMemberPage({
  params,
}: {
  params: Promise<{ membershipId: string }>;
}) {
  const { membershipId } = await params;
  redirect(`/app/team/${membershipId}/availability`);
}

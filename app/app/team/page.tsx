import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, PageHeader, Avatar } from "@/components/app/ui";
import { FormSubmitButton } from "@/components/app/FormSubmitButton";
import { getAppSession } from "@/server/permissions/session";
import { canManageTeam } from "@/server/permissions/can";
import { listTeamMembers } from "@/server/repositories/team";
import { listPendingTeamInvites } from "@/server/repositories/team-invites";
import { inviteTeamMemberAction } from "@/server/actions/team";
import { prisma } from "@/lib/db/prisma";

const roleColor: Record<string, string> = {
  owner: "bg-brand-100 text-brand-800",
  admin: "bg-brand-100 text-brand-800",
  dispatcher: "bg-amber-100 text-amber-700",
  worker: "bg-ink-100 text-ink-600",
  viewer: "bg-ink-100 text-ink-500",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/team");
  if (!canManageTeam(session)) redirect("/app/dashboard?error=Permission%20denied");

  const params = await searchParams;
  const [members, pendingInvites] = await Promise.all([
    listTeamMembers(session.organizationId),
    canManageTeam(session) ? listPendingTeamInvites(session.organizationId) : Promise.resolve([]),
  ]);

  const jobCounts = await prisma.jobAssignment.groupBy({
    by: ["membershipId"],
    where: { job: { organizationId: session.organizationId } },
    _count: { jobId: true },
  });
  const countMap = Object.fromEntries(jobCounts.map((c) => [c.membershipId, c._count.jobId]));

  return (
    <>
      <PageHeader title="Team" subtitle="Members, roles, and assignments." />

      {params.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(params.error)}
        </p>
      )}
      {params.invited === "1" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-900 ring-1 ring-brand-100">
          Invite sent — they will receive an email with a link to join your crew.
        </p>
      )}

      {canManageTeam(session) && (
        <Card className="mb-6 p-5">
          <h2 className="mb-4 text-sm font-bold text-ink-950">Invite team member</h2>
          <form action={inviteTeamMemberAction} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Email
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="worker@example.com"
                className="w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink-200"
              />
            </div>
            <div className="min-w-[10rem]">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Role
              </label>
              <select
                name="role"
                defaultValue="worker"
                className="w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink-200"
              >
                <option value="worker">Worker (crew app)</option>
                <option value="dispatcher">Dispatcher</option>
              </select>
            </div>
            <FormSubmitButton loadingLabel="Sending…">Send invite</FormSubmitButton>
          </form>
        </Card>
      )}

      {pendingInvites.length > 0 && (
        <Card className="mb-6 overflow-hidden">
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-sm font-bold text-ink-950">Pending invites</h2>
          </div>
          <ul className="divide-y divide-ink-100">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-950">{invite.email}</p>
                  <p className="text-xs text-ink-500">
                    Invited by {invite.invitedBy.user.name ?? invite.invitedBy.user.email}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">
                  {invite.role} · pending
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="overflow-hidden">
        <ul className="divide-y divide-ink-100">
          {members.map((m) => {
            const name = m.user.name ?? m.user.email.split("@")[0];
            const initials = name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <li key={m.id}>
                <Link
                  href={`/app/team/${m.id}/availability`}
                  className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-ink-50"
                >
                  <Avatar initials={initials} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-950">{name}</p>
                    <p className="text-xs text-ink-500">{m.user.email}</p>
                  </div>
                  <span className="text-xs text-ink-500">{countMap[m.id] ?? 0} assigned jobs</span>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
                    Hours
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleColor[m.role] ?? roleColor.viewer}`}
                  >
                    {m.role}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}

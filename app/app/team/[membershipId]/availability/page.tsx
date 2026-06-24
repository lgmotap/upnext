import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, PageHeader } from "@/components/app/ui";
import { WeeklyHoursForm } from "@/components/app/WeeklyHoursForm";
import { getAppSession } from "@/server/permissions/session";
import { canManageTeam } from "@/server/permissions/can";
import {
  getMembershipForOrg,
  listMembershipAvailabilityRules,
} from "@/server/repositories/membership-availability";
import { saveMembershipAvailabilityAction } from "@/server/actions/membership-availability";
import { defaultWeeklyRules } from "@/server/validators/availability";

export default async function MemberAvailabilityPage({
  params,
  searchParams,
}: {
  params: Promise<{ membershipId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/team");
  if (!canManageTeam(session)) redirect("/app/dashboard?error=Permission%20denied");

  const { membershipId } = await params;
  const query = await searchParams;

  const member = await getMembershipForOrg(session.organizationId, membershipId);
  if (!member) redirect("/app/team?error=Team%20member%20not%20found");

  const existing = await listMembershipAvailabilityRules(membershipId);
  const defaults = defaultWeeklyRules();
  const rulesByDay = Object.fromEntries(existing.map((r) => [r.dayOfWeek, r]));
  const rules =
    existing.length > 0
      ? defaults.map((d) => {
          const row = rulesByDay[d.dayOfWeek];
          return row
            ? {
                dayOfWeek: row.dayOfWeek,
                startTime: row.startTime,
                endTime: row.endTime,
                isActive: row.isActive,
              }
            : d;
        })
      : defaults;

  const name = member.user.name ?? member.user.email.split("@")[0];

  return (
    <>
      <PageHeader
        title={`${name}'s hours`}
        subtitle="Worker schedule intersects with business hours for manual booking and rescheduling."
        action={
          <Link
            href="/app/team"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
          >
            <ArrowLeft className="size-4" /> Back to team
          </Link>
        }
      />

      {query.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {decodeURIComponent(query.error)}
        </p>
      )}
      {query.saved === "1" && (
        <p className="mb-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 ring-1 ring-brand-100">
          Worker hours saved.
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-ink-100 px-5 py-3">
          <h2 className="text-sm font-bold text-ink-950">Weekly schedule</h2>
          <p className="mt-0.5 text-xs text-ink-500">
            Leave unset (save defaults) to follow business hours only. Custom hours narrow available
            slots when this worker is assigned.
          </p>
        </div>
        <form action={saveMembershipAvailabilityAction}>
          <WeeklyHoursForm rules={rules} canEdit hiddenFields={{ membershipId }} />
          <div className="border-t border-ink-100 px-5 py-3">
            <button
              type="submit"
              className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-300"
            >
              Save worker hours
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}

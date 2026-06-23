import { Card, PageHeader, Avatar, AppButton } from "@/components/app/ui";
import { team } from "@/lib/mock/data";

const roleColor: Record<string, string> = {
  owner: "bg-brand-100 text-brand-800",
  admin: "bg-brand-100 text-brand-800",
  dispatcher: "bg-amber-100 text-amber-700",
  worker: "bg-ink-100 text-ink-600",
  viewer: "bg-ink-100 text-ink-500",
};

export default function TeamPage() {
  return (
    <>
      <PageHeader
        title="Team"
        subtitle="Members, roles, and assignments."
        action={<AppButton>+ Invite member</AppButton>}
      />

      <Card className="overflow-hidden">
        <ul className="divide-y divide-ink-100">
          {team.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <Avatar initials={m.initials} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-950">
                  {m.name} {!m.active && <span className="ml-1 text-xs font-normal text-ink-400">(inactive)</span>}
                </p>
                <p className="text-xs text-ink-500">{m.email}</p>
              </div>
              <span className="text-xs text-ink-500">{m.jobsThisWeek} jobs / wk</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleColor[m.role]}`}>{m.role}</span>
              <button className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100">Manage</button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

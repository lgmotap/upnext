import Link from "next/link";
import { Card, PageHeader, AppButton } from "@/components/app/ui";
import { jobs } from "@/lib/mock/data";

const days = [
  { label: "Mon", date: "16", today: true },
  { label: "Tue", date: "17" },
  { label: "Wed", date: "18" },
  { label: "Thu", date: "19" },
  { label: "Fri", date: "20" },
  { label: "Sat", date: "21" },
  { label: "Sun", date: "22" },
];

const statusColor: Record<string, string> = {
  in_progress: "border-amber-400 bg-amber-50 text-amber-800",
  confirmed: "border-brand-400 bg-brand-50 text-brand-800",
  scheduled: "border-ink-300 bg-ink-50 text-ink-700",
  completed: "border-brand-500 bg-brand-100 text-brand-800",
};

// spread the mock jobs across the week for the preview
const byDay = days.map((d, i) => ({
  ...d,
  jobs: jobs.filter((_, idx) => idx % 7 === i || (d.today && jobs[idx]?.date === "Today")),
}));

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="June 16 – 22 · week view"
        action={
          <div className="flex items-center gap-2">
            <AppButton variant="outline">Day</AppButton>
            <AppButton variant="ghost">Week</AppButton>
            <AppButton>+ New job</AppButton>
          </div>
        }
      />

      <Card className="overflow-x-auto p-3">
        <div className="grid min-w-[760px] grid-cols-7 gap-2">
          {byDay.map((d) => (
            <div key={d.label} className="min-h-[22rem]">
              <div className={`mb-2 rounded-xl px-3 py-2 text-center ${d.today ? "bg-brand-950 text-white" : "bg-ink-50 text-ink-600"}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide">{d.label}</p>
                <p className="text-lg font-bold">{d.date}</p>
              </div>
              <div className="space-y-2">
                {d.jobs.map((j) => (
                  <Link
                    key={j.id}
                    href={`/app/jobs/${j.id}`}
                    className={`block rounded-lg border-l-2 px-2.5 py-2 text-left transition hover:shadow-soft ${statusColor[j.status] ?? statusColor.scheduled}`}
                  >
                    <p className="text-[11px] font-bold">{j.start}</p>
                    <p className="truncate text-xs font-semibold">{j.customer}</p>
                    <p className="truncate text-[11px] opacity-70">{j.service}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

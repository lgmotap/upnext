import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/app/StatusBadge";
import { jobs } from "@/lib/mock/data";

export default function CrewTodayPage() {
  const myJobs = jobs.filter((j) => j.date === "Today" && j.assigneeInitials === "MR");

  return (
    <div className="px-4 py-5">
      <div className="mb-4">
        <p className="text-sm text-ink-500">Good morning, Maya</p>
        <h1 className="text-2xl font-bold tracking-tight text-ink-950">
          {myJobs.length} jobs today
        </h1>
      </div>

      <div className="space-y-3">
        {myJobs.map((j) => (
          <Link
            key={j.id}
            href={`/crew/jobs/${j.id}`}
            className="block rounded-2xl bg-white p-4 ring-1 ring-ink-100 shadow-soft active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink-950">{j.start}</span>
              <StatusBadge status={j.status} />
            </div>
            <p className="mt-1 text-base font-semibold text-ink-950">{j.customer}</p>
            <p className="text-sm text-ink-500">{j.service}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                <MapPin className="size-3.5" /> {j.address}
              </span>
              <ChevronRight className="size-4 text-ink-300" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

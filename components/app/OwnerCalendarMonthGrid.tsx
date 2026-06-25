import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { buildMonthGrid, weekdayHeaders } from "@/lib/availability/calendar-ui";
import { getWeekStartYmd } from "@/lib/datetime/calendar";

export function OwnerCalendarMonthGrid({
  monthKey,
  timeZone,
  todayYmd,
  jobsByDate,
  pendingByDate,
  conflictJobIdsByDate,
}: {
  monthKey: string;
  timeZone: string;
  todayYmd: string;
  jobsByDate: Record<string, number>;
  pendingByDate: Record<string, number>;
  conflictJobIdsByDate: Record<string, number>;
}) {
  const grid = buildMonthGrid(monthKey);

  return (
    <div className="grid grid-cols-7 gap-1 text-center">
      {weekdayHeaders().map((w) => (
        <div key={w} className="py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
          {w}
        </div>
      ))}
      {grid.map((cell, idx) => {
        if (!cell.date || !cell.inMonth) {
          return <div key={`pad-${idx}`} className="aspect-square min-h-[4.5rem]" aria-hidden />;
        }

        const jobCount = jobsByDate[cell.date] ?? 0;
        const pendingCount = pendingByDate[cell.date] ?? 0;
        const conflictCount = conflictJobIdsByDate[cell.date] ?? 0;
        const isToday = cell.date === todayYmd;
        const weekStart = getWeekStartYmd(timeZone, cell.date);

        return (
          <Link
            key={cell.date}
            href={`/app/calendar?view=week&week=${weekStart}`}
            className={`relative flex aspect-square min-h-[4.5rem] flex-col items-center justify-center rounded-xl text-sm font-semibold transition hover:bg-brand-50 hover:ring-1 hover:ring-brand-200 ${
              isToday ? "bg-brand-950 text-white hover:bg-brand-900" : "bg-ink-50 text-ink-800"
            }`}
            aria-label={`${cell.date}: ${jobCount} job${jobCount === 1 ? "" : "s"}${pendingCount ? `, ${pendingCount} pending` : ""}`}
          >
            <span>{cell.dayNum}</span>
            {(jobCount > 0 || pendingCount > 0) && (
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                {jobCount > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isToday ? "bg-white/20 text-white" : "bg-brand-200 text-brand-900"
                    }`}
                  >
                    {jobCount}
                  </span>
                )}
                {pendingCount > 0 && (
                  <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                    {pendingCount}p
                  </span>
                )}
                {conflictCount > 0 && (
                  <AlertTriangle
                    className={`size-3 ${isToday ? "text-amber-300" : "text-amber-600"}`}
                    aria-label={`${conflictCount} scheduling conflict${conflictCount === 1 ? "" : "s"}`}
                  />
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}

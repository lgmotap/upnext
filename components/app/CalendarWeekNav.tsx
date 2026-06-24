import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDaysYmd } from "@/lib/datetime/timezone";

export function CalendarWeekNav({ weekStartYmd, isCurrentWeek }: { weekStartYmd: string; isCurrentWeek: boolean }) {
  const prevWeek = addDaysYmd(weekStartYmd, -7);
  const nextWeek = addDaysYmd(weekStartYmd, 7);

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/app/calendar?week=${prevWeek}`}
        aria-label="Previous week"
        className="flex size-9 items-center justify-center rounded-full text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
      >
        <ChevronLeft className="size-4" />
      </Link>
      {!isCurrentWeek && (
        <Link
          href="/app/calendar"
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
        >
          Today
        </Link>
      )}
      <Link
        href={`/app/calendar?week=${nextWeek}`}
        aria-label="Next week"
        className="flex size-9 items-center justify-center rounded-full text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
      >
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

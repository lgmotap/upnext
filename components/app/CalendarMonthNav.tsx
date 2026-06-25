import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarMonthNav({
  monthKey,
  isCurrentMonth,
}: {
  monthKey: string;
  isCurrentMonth: boolean;
}) {
  const [y, m] = monthKey.split("-").map(Number);
  const prev = shiftMonth(y, m, -1);
  const next = shiftMonth(y, m, 1);

  return (
    <div className="flex items-center gap-1">
      <Link
        href={`/app/calendar?view=month&month=${prev}`}
        aria-label="Previous month"
        className="flex size-9 items-center justify-center rounded-full text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
      >
        <ChevronLeft className="size-4" />
      </Link>
      {!isCurrentMonth && (
        <Link
          href="/app/calendar?view=month"
          className="rounded-full px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
        >
          Today
        </Link>
      )}
      <Link
        href={`/app/calendar?view=month&month=${next}`}
        aria-label="Next month"
        className="flex size-9 items-center justify-center rounded-full text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50"
      >
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}

function shiftMonth(year: number, month: number, delta: number): string {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

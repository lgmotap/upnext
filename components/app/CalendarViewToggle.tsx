import Link from "next/link";

export function CalendarViewToggle({
  view,
  weekStartYmd,
  monthKey,
}: {
  view: "week" | "month";
  weekStartYmd: string;
  monthKey: string;
}) {
  const weekHref = `/app/calendar?view=week&week=${weekStartYmd}`;
  const monthHref = `/app/calendar?view=month&month=${monthKey}`;

  return (
    <div className="inline-flex rounded-full bg-ink-100 p-0.5 ring-1 ring-ink-200">
      <Link
        href={weekHref}
        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
          view === "week" ? "bg-white text-ink-950 shadow-sm" : "text-ink-600 hover:text-ink-900"
        }`}
      >
        Week
      </Link>
      <Link
        href={monthHref}
        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
          view === "month" ? "bg-white text-ink-950 shadow-sm" : "text-ink-600 hover:text-ink-900"
        }`}
      >
        Month
      </Link>
    </div>
  );
}

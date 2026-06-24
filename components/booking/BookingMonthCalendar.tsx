"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildMonthGrid,
  clampMonthKey,
  formatMonthLabel,
  weekdayHeaders,
  type BookableDay,
} from "@/lib/availability/calendar-ui";
import { formatYmdInTimezone } from "@/lib/datetime/timezone";

export function BookingMonthCalendar({
  days,
  selectedDate,
  viewMonth,
  timeZone,
  onSelectDate,
  onViewMonthChange,
  pending,
}: {
  days: BookableDay[];
  selectedDate: string;
  viewMonth: string;
  timeZone: string;
  onSelectDate: (dateYmd: string) => void;
  onViewMonthChange: (monthKey: string) => void;
  pending?: boolean;
}) {
  const available = new Set(days.map((d) => d.date));
  const monthKeys = [...new Set(days.map((d) => d.monthKey))].sort();
  const minMonth = monthKeys[0] ?? viewMonth;
  const maxMonth = monthKeys[monthKeys.length - 1] ?? viewMonth;
  const clampedView = clampMonthKey(viewMonth, minMonth, maxMonth);

  const grid = buildMonthGrid(clampedView);
  const monthLabel = formatMonthLabel(clampedView, timeZone);
  const canPrev = clampedView > minMonth;
  const canNext = clampedView < maxMonth;

  const todayKey = formatYmdInTimezone(new Date(), timeZone);

  if (days.length === 0) {
    return <p className="text-sm text-ink-500">No available days in the booking window.</p>;
  }

  return (
    <div className={pending ? "opacity-60 transition-opacity" : ""}>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => canPrev && onViewMonthChange(shiftMonth(clampedView, -1))}
          disabled={!canPrev}
          aria-label="Previous month"
          className="flex size-9 items-center justify-center rounded-full text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="text-center">
          <p className="text-base font-bold text-ink-950">{monthLabel}</p>
          <p className="text-xs text-ink-500">Select an available date</p>
        </div>
        <button
          type="button"
          onClick={() => canNext && onViewMonthChange(shiftMonth(clampedView, 1))}
          disabled={!canNext}
          aria-label="Next month"
          className="flex size-9 items-center justify-center rounded-full text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdayHeaders().map((w) => (
          <div key={w} className="py-1 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
            {w}
          </div>
        ))}
        {grid.map((cell, idx) => {
          if (!cell.date || !cell.inMonth) {
            return <div key={`pad-${idx}`} className="aspect-square" aria-hidden />;
          }

          const isAvailable = available.has(cell.date);
          const isSelected = selectedDate === cell.date;
          const isToday = cell.date === todayKey;

          return (
            <button
              key={cell.date}
              type="button"
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelectDate(cell.date!)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition ${
                isSelected
                  ? "bg-brand-400 text-brand-950 shadow-soft ring-2 ring-brand-500"
                  : isAvailable
                    ? "bg-white text-ink-900 ring-1 ring-ink-200 hover:bg-brand-50 hover:ring-brand-300"
                    : "cursor-not-allowed text-ink-300"
              }`}
              aria-label={
                isAvailable
                  ? `Book on ${cell.date}`
                  : `Unavailable ${cell.date}`
              }
              aria-pressed={isSelected}
            >
              {cell.dayNum}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 size-1 rounded-full bg-brand-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

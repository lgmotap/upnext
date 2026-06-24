/** Month-grid helpers for public booking calendar (Calendly-style). */

export type BookableDay = {
  date: string;
  weekdayShort: string;
  dayNum: number;
  monthKey: string;
  monthLabel: string;
};

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function weekdayHeaders(): readonly string[] {
  return WEEKDAY_HEADERS;
}

export function monthKeyFromYmd(dateYmd: string): string {
  return dateYmd.slice(0, 7);
}

export function parseMonthKey(monthKey: string): { year: number; month: number } {
  const [y, m] = monthKey.split("-").map(Number);
  return { year: y, month: m };
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const { year, month } = parseMonthKey(monthKey);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function formatMonthLabel(monthKey: string, timeZone: string): string {
  const { year, month } = parseMonthKey(monthKey);
  const probe = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", { timeZone, month: "long", year: "numeric" }).format(probe);
}

export function enrichBookableDay(dateYmd: string, timeZone: string): BookableDay {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const weekdayShort = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(probe);
  const monthKey = monthKeyFromYmd(dateYmd);
  return {
    date: dateYmd,
    weekdayShort,
    dayNum: d,
    monthKey,
    monthLabel: formatMonthLabel(monthKey, timeZone),
  };
}

export type CalendarCell = {
  date: string | null;
  dayNum: number | null;
  inMonth: boolean;
};

/** Build a 6-row Sunday-start grid for the given month. */
export function buildMonthGrid(monthKey: string): CalendarCell[] {
  const { year, month } = parseMonthKey(monthKey);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startDow = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: CalendarCell[] = [];

  for (let i = 0; i < startDow; i++) {
    cells.push({ date: null, dayNum: null, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    cells.push({ date: `${year}-${mm}-${dd}`, dayNum: day, inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, dayNum: null, inMonth: false });
  }

  return cells;
}

export function groupDaysByMonth(days: BookableDay[]): Map<string, BookableDay[]> {
  const map = new Map<string, BookableDay[]>();
  for (const day of days) {
    const list = map.get(day.monthKey) ?? [];
    list.push(day);
    map.set(day.monthKey, list);
  }
  return map;
}

export function clampMonthKey(monthKey: string, minKey: string, maxKey: string): string {
  if (monthKey < minKey) return minKey;
  if (monthKey > maxKey) return maxKey;
  return monthKey;
}

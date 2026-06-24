import { DAY_LABELS } from "@/server/validators/availability";

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const input =
  "rounded-xl bg-white px-3 py-2 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400";

export type WeeklyHourRule = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export function WeeklyHoursForm({
  rules,
  canEdit,
  hiddenFields,
}: {
  rules: WeeklyHourRule[];
  canEdit: boolean;
  hiddenFields?: Record<string, string>;
}) {
  return (
    <>
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      <ul className="divide-y divide-ink-100">
        {DISPLAY_ORDER.map((dayOfWeek) => {
          const rule = rules.find((r) => r.dayOfWeek === dayOfWeek)!;
          return (
            <li key={dayOfWeek} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <label className="flex w-32 items-center gap-2">
                <input
                  type="checkbox"
                  name={`isActive_${dayOfWeek}`}
                  defaultChecked={rule.isActive}
                  disabled={!canEdit}
                  className="rounded"
                />
                <span className="text-sm font-semibold text-ink-900">{DAY_LABELS[dayOfWeek]}</span>
              </label>
              <input
                type="time"
                name={`startTime_${dayOfWeek}`}
                defaultValue={rule.startTime}
                disabled={!canEdit}
                className={input}
              />
              <span className="text-ink-400">–</span>
              <input
                type="time"
                name={`endTime_${dayOfWeek}`}
                defaultValue={rule.endTime}
                disabled={!canEdit}
                className={input}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function WeeklyHoursReadOnly({ rules }: { rules: WeeklyHourRule[] }) {
  const active = DISPLAY_ORDER.map((d) => rules.find((r) => r.dayOfWeek === d)!).filter(
    (r) => r.isActive,
  );

  if (active.length === 0) {
    return <p className="text-sm text-ink-500">No working hours set — follows business default.</p>;
  }

  return (
    <ul className="space-y-1 text-sm text-ink-700">
      {active.map((r) => (
        <li key={r.dayOfWeek}>
          <span className="font-semibold text-ink-900">{DAY_LABELS[r.dayOfWeek]}</span>
          <span className="text-ink-500">
            {" "}
            · {formatHm12(r.startTime)} – {formatHm12(r.endTime)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function formatHm12(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

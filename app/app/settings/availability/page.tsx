import { redirect } from "next/navigation";
import { Card, CardHeader } from "@/components/app/ui";
import { getAppSession } from "@/server/permissions/session";
import { canManageServices } from "@/server/permissions/can";
import {
  listAvailabilityRules,
  listBlackoutDates,
  getBookingSettings,
} from "@/server/repositories/availability";
import {
  DAY_LABELS,
  defaultWeeklyRules,
} from "@/server/validators/availability";
import {
  saveWeeklyAvailabilityAction,
  saveBookingWindowAction,
  addBlackoutDateAction,
  removeBlackoutDateAction,
} from "@/server/actions/availability";

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const input =
  "rounded-xl bg-white px-3 py-2 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400";

export default async function AvailabilitySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/sign-in?next=/app/settings/availability");

  const params = await searchParams;
  const canEdit = canManageServices(session);

  const [existingRules, blackouts, booking] = await Promise.all([
    listAvailabilityRules(session.organizationId),
    listBlackoutDates(session.organizationId),
    getBookingSettings(session.organizationId),
  ]);

  const defaults = defaultWeeklyRules();
  const rulesByDay = Object.fromEntries(existingRules.map((r) => [r.dayOfWeek, r]));
  const rules =
    existingRules.length > 0
      ? defaults.map((d) => {
          const row = rulesByDay[d.dayOfWeek];
          return row
            ? {
                dayOfWeek: row.dayOfWeek,
                startTime: row.startTime,
                endTime: row.endTime,
                isActive: row.isActive,
              }
            : d;
        })
      : defaults;

  const minNoticeHours = booking?.minNoticeHours ?? 24;
  const maxBookingDaysAhead = booking?.maxBookingDaysAhead ?? 60;
  const slotIntervalMinutes = booking?.slotIntervalMinutes ?? 30;

  return (
    <div className="space-y-4">
      {params.error && (
        <p className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 ring-1 ring-rose-100">
          {params.error}
        </p>
      )}
      {params.saved === "1" && (
        <p className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm text-brand-800 ring-1 ring-brand-100">
          Settings saved.
        </p>
      )}

      <Card>
        <CardHeader title="Weekly hours" />
        <form action={saveWeeklyAvailabilityAction}>
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
          {canEdit && (
            <div className="border-t border-ink-100 px-5 py-3">
              <button
                type="submit"
                className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-300"
              >
                Save weekly hours
              </button>
            </div>
          )}
        </form>
      </Card>

      <Card>
        <CardHeader title="Booking window" />
        <form action={saveBookingWindowAction} className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Minimum notice (hours)">
            <input
              name="minNoticeHours"
              type="number"
              min={0}
              max={168}
              defaultValue={minNoticeHours}
              disabled={!canEdit}
              className={`w-full ${input}`}
            />
          </Field>
          <Field label="Maximum days ahead">
            <input
              name="maxBookingDaysAhead"
              type="number"
              min={1}
              max={365}
              defaultValue={maxBookingDaysAhead}
              disabled={!canEdit}
              className={`w-full ${input}`}
            />
          </Field>
          <Field label="Slot interval (minutes)">
            <input
              name="slotIntervalMinutes"
              type="number"
              min={15}
              max={120}
              step={15}
              defaultValue={slotIntervalMinutes}
              disabled={!canEdit}
              className={`w-full ${input}`}
            />
          </Field>
          {canEdit && (
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-brand-400 px-4 py-2 text-sm font-bold text-brand-950 hover:bg-brand-300"
              >
                Save booking window
              </button>
            </div>
          )}
        </form>
      </Card>

      <Card>
        <CardHeader title="Blackout dates" />
        <div className="p-5">
          {blackouts.length === 0 ? (
            <p className="mb-4 text-sm text-ink-500">No blackout dates configured.</p>
          ) : (
            <ul className="mb-4 divide-y divide-ink-100 rounded-xl ring-1 ring-ink-100">
              {blackouts.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {formatDateRange(b.startsAt, b.endsAt)}
                    </p>
                    {b.reason && <p className="text-xs text-ink-500">{b.reason}</p>}
                  </div>
                  {canEdit && (
                    <form action={removeBlackoutDateAction}>
                      <input type="hidden" name="blackoutId" value={b.id} />
                      <button type="submit" className="text-xs font-semibold text-rose-600 hover:underline">
                        Remove
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          {canEdit && (
            <form action={addBlackoutDateAction} className="grid gap-3 sm:grid-cols-2">
              <Field label="Starts">
                <input name="startsAt" type="datetime-local" required className={`w-full ${input}`} />
              </Field>
              <Field label="Ends">
                <input name="endsAt" type="datetime-local" required className={`w-full ${input}`} />
              </Field>
              <Field label="Reason (optional)" className="sm:col-span-2">
                <input name="reason" type="text" maxLength={200} placeholder="Holiday" className={`w-full ${input}`} />
              </Field>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"
                >
                  Add blackout
                </button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function formatDateRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

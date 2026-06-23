import { Card, CardHeader, AppButton } from "@/components/app/ui";

const week = [
  { day: "Monday", on: true, from: "8:00 AM", to: "6:00 PM" },
  { day: "Tuesday", on: true, from: "8:00 AM", to: "6:00 PM" },
  { day: "Wednesday", on: true, from: "8:00 AM", to: "6:00 PM" },
  { day: "Thursday", on: true, from: "8:00 AM", to: "6:00 PM" },
  { day: "Friday", on: true, from: "8:00 AM", to: "5:00 PM" },
  { day: "Saturday", on: true, from: "9:00 AM", to: "2:00 PM" },
  { day: "Sunday", on: false, from: "—", to: "—" },
];

export default function AvailabilitySettingsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Weekly hours" action={<AppButton>Save</AppButton>} />
        <ul className="divide-y divide-ink-100">
          {week.map((d) => (
            <li key={d.day} className="flex items-center gap-4 px-5 py-3">
              <span
                className={`relative h-5 w-9 rounded-full transition ${d.on ? "bg-brand-400" : "bg-ink-200"}`}
                aria-hidden
              >
                <span className={`absolute top-0.5 size-4 rounded-full bg-white transition ${d.on ? "left-4" : "left-0.5"}`} />
              </span>
              <span className="w-28 text-sm font-semibold text-ink-900">{d.day}</span>
              <span className="text-sm text-ink-600">{d.on ? `${d.from} – ${d.to}` : "Closed"}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Booking window" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Stat label="Minimum notice" value="24 hours" />
          <Stat label="Maximum future booking" value="60 days" />
          <Stat label="Blackout dates" value="Jul 4 (Holiday)" />
          <Stat label="Slot interval" value="30 minutes" />
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="text-sm font-bold text-ink-950">{value}</p>
    </div>
  );
}

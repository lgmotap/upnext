import { Card, CardHeader } from "@/components/app/ui";

const settings = [
  { label: "New booking request", desc: "Email me when a customer submits a request.", on: true },
  { label: "Booking confirmation to customer", desc: "Send an automatic confirmation email.", on: true },
  { label: "24-hour reminder", desc: "Remind customers the day before their job.", on: true },
  { label: "2-hour reminder", desc: "Send a same-day reminder before arrival.", on: false },
  { label: "Job completed summary", desc: "Email the customer a recap when a job is done.", on: true },
  { label: "Payment request", desc: "Email a payment link when requested.", on: true },
];

export default function NotificationSettingsPage() {
  return (
    <Card>
      <CardHeader title="Email notifications" />
      <ul className="divide-y divide-ink-100">
        {settings.map((s) => (
          <li key={s.label} className="flex items-center gap-4 px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-950">{s.label}</p>
              <p className="text-xs text-ink-500">{s.desc}</p>
            </div>
            <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${s.on ? "bg-brand-400" : "bg-ink-200"}`} aria-hidden>
              <span className={`absolute top-0.5 size-4 rounded-full bg-white transition ${s.on ? "left-4" : "left-0.5"}`} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

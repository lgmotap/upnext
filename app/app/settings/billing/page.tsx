import { Check } from "lucide-react";
import { Card, CardHeader, AppButton } from "@/components/app/ui";

const plans = [
  { name: "Solo", price: "$19", blurb: "One operator", features: ["1 team seat", "Online booking", "Jobs & calendar", "Payment tracking"], current: false },
  { name: "Team", price: "$49", blurb: "Small crews", features: ["Up to 10 seats", "Crew mobile view", "Assignments & roles", "Email reminders"], current: true },
  { name: "Business", price: "$99", blurb: "Growing teams", features: ["Unlimited seats", "Advanced reporting", "Priority support", "Integrations"], current: false },
];

export default function BillingSettingsPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Current plan" action={<AppButton variant="outline">Manage in Stripe</AppButton>} />
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-lg font-bold text-ink-950">Team — $49 / month</p>
            <p className="text-sm text-ink-500">Renews Jul 16 · 5 of 10 seats used</p>
          </div>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800">Active</span>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.name} className={`p-5 ${p.current ? "ring-2 ring-brand-400" : ""}`}>
            <p className="text-sm font-semibold text-ink-500">{p.name}</p>
            <p className="mt-1 text-3xl font-bold text-ink-950">{p.price}<span className="text-sm font-medium text-ink-400">/mo</span></p>
            <p className="text-xs text-ink-500">{p.blurb}</p>
            <ul className="mt-4 space-y-1.5">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-ink-700">
                  <Check className="size-4 text-brand-600" /> {f}
                </li>
              ))}
            </ul>
            <button
              className={`mt-4 w-full rounded-full py-2 text-sm font-bold ${
                p.current ? "bg-ink-100 text-ink-500" : "bg-brand-400 text-brand-950 hover:bg-brand-300"
              }`}
              disabled={p.current}
            >
              {p.current ? "Current plan" : `Switch to ${p.name}`}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

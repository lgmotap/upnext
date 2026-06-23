import { Clock } from "lucide-react";
import { Card, PageHeader, AppButton } from "@/components/app/ui";
import { services, formatMoney } from "@/lib/mock/data";

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        title="Services"
        subtitle="What customers can book, with duration and price."
        action={<AppButton>+ Add service</AppButton>}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-ink-950">{s.name}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  s.isActive ? "bg-brand-100 text-brand-800" : "bg-ink-100 text-ink-500"
                }`}
              >
                {s.isActive ? "Active" : "Hidden"}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-ink-950">{formatMoney(s.priceCents)}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-ink-500">
              <span className="inline-flex items-center gap-1"><Clock className="size-3.5" /> {s.durationMinutes} min</span>
              <span>{s.bookings} bookings</span>
            </div>
            <div className="mt-4 flex gap-2 border-t border-ink-100 pt-3">
              <button className="flex-1 rounded-full py-2 text-xs font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100">Edit</button>
              <button className="flex-1 rounded-full py-2 text-xs font-semibold text-ink-500 hover:bg-ink-100">{s.isActive ? "Hide" : "Show"}</button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

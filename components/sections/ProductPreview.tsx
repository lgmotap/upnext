"use client";

import { useState } from "react";
import { ClipboardList, Users, CalendarDays, Wallet, BellRing, Globe } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { CleanCalendarMock } from "@/components/mockups/BeforeAfterMocks";
import { BookingPortalDemo } from "@/components/mockups/BookingPortalDemo";

const tabs = ["Client portal", "Jobs", "Customers", "Calendar", "Payments"] as const;
type Tab = (typeof tabs)[number];

const tabIcons: Record<Tab, typeof ClipboardList> = {
  "Client portal": Globe,
  Jobs: ClipboardList,
  Customers: Users,
  Calendar: CalendarDays,
  Payments: Wallet,
};

const jobRows = [
  { client: "Harper Residence", service: "Deep clean", who: "Maya R.", time: "8:30 AM", status: "In progress", cls: "bg-amber-50 text-amber-700" },
  { client: "Lakeside Offices", service: "Commercial clean", who: "Team A", time: "10:00 AM", status: "Scheduled", cls: "bg-ink-100 text-ink-600" },
  { client: "Nguyen Family", service: "Recurring — biweekly", who: "Jordan P.", time: "1:30 PM", status: "Confirmed", cls: "bg-brand-100 text-brand-800" },
  { client: "Oak St. Rental", service: "Move-out clean", who: "Maya R.", time: "3:00 PM", status: "Completed", cls: "bg-emerald-50 text-emerald-700" },
  { client: "Greenway LLC", service: "Office — evenings", who: "Team A", time: "6:00 PM", status: "Scheduled", cls: "bg-ink-100 text-ink-600" },
];

const customers = [
  { name: "Kate Henderson", info: "Recurring · every 2 weeks · 14 jobs", note: "Prefers eco products. Spare key under planter.", due: "Follow up: quote for windows" },
  { name: "Lakeside Offices", info: "Commercial · Mon & Thu · 31 jobs", note: "Pick up keys at front desk. Invoice monthly.", due: "Contract renewal in 3 weeks" },
  { name: "Raj Patel", info: "One-time · carpet · 2 jobs", note: "Has two cats. Park in driveway.", due: "Follow up: re-quote stairs" },
];

const payments = [
  { client: "Oak St. Rental", amount: "$340", status: "Paid", cls: "bg-emerald-50 text-emerald-700" },
  { client: "Nguyen Family", amount: "$160", status: "Paid", cls: "bg-emerald-50 text-emerald-700" },
  { client: "Lakeside Offices", amount: "$420", status: "Pending", cls: "bg-amber-50 text-amber-700" },
  { client: "Raj Patel", amount: "$280", status: "Overdue", cls: "bg-rose-50 text-rose-700" },
];

function JobsPanel() {
  return (
    <div className="space-y-2">
      {jobRows.map((j) => (
        <div key={j.client} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-white px-4 py-3 ring-1 ring-ink-100">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-ink-950">{j.client}</p>
            <p className="text-xs text-ink-500">{j.service} · {j.who}</p>
          </div>
          <span className="text-xs font-medium text-ink-500">{j.time}</span>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${j.cls}`}>{j.status}</span>
        </div>
      ))}
    </div>
  );
}

function CustomersPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {customers.map((c) => (
        <div key={c.name} className="rounded-xl bg-white p-4 ring-1 ring-ink-100">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
              {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <p className="text-sm font-bold text-ink-950">{c.name}</p>
          </div>
          <p className="text-xs text-ink-500">{c.info}</p>
          <p className="mt-2 rounded-lg bg-ink-50 p-2 text-xs text-ink-600">{c.note}</p>
          <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <BellRing className="size-3" /> {c.due}
          </p>
        </div>
      ))}
    </div>
  );
}

function PaymentsPanel() {
  return (
    <div>
      <div className="mb-3 grid grid-cols-3 gap-3">
        {[
          { label: "Collected this month", value: "$12,480", cls: "text-emerald-600" },
          { label: "Pending", value: "$1,240", cls: "text-amber-600" },
          { label: "Overdue", value: "$280", cls: "text-rose-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-3 text-center ring-1 ring-ink-100 sm:p-4">
            <p className={`text-lg font-bold sm:text-xl ${s.cls}`}>{s.value}</p>
            <p className="text-[11px] text-ink-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {payments.map((p) => (
          <div key={p.client} className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 ring-1 ring-ink-100">
            <p className="flex-1 text-sm font-semibold text-ink-900">{p.client}</p>
            <span className="text-sm font-bold text-ink-950">{p.amount}</span>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.cls}`}>{p.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductPreview() {
  const [active, setActive] = useState<Tab>("Client portal");

  return (
    <Section className="relative">
      <div className="absolute inset-x-0 top-1/4 -z-10 h-96 bg-gradient-to-b from-transparent via-brand-50/50 to-transparent" />
      <SectionHeading
        eyebrow="Product preview"
        title="The booking page your customers see — and the dashboard behind it"
        subtitle="Start with the online booking experience your customers get, then see how every request flows into your jobs, calendar, and payments."
      />
      <div className="relative mx-auto max-w-4xl">
        <div role="tablist" aria-label="Product areas" className="mb-5 flex flex-wrap justify-center gap-2">
          {tabs.map((t) => {
            const Icon = tabIcons[t];
            const selected = t === active;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(t)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  selected
                    ? "bg-brand-600 text-white shadow-md"
                    : "bg-white text-ink-600 ring-1 ring-ink-200 hover:text-brand-700 hover:ring-brand-300"
                }`}
              >
                <Icon className="size-4" aria-hidden /> {t}
                {t === "Client portal" && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      selected ? "bg-white/20 text-white" : "bg-brand-100 text-brand-800"
                    }`}
                  >
                    Try it
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div
          role="tabpanel"
          className="min-h-[22rem] rounded-3xl bg-ink-50/70 p-4 ring-1 ring-ink-200/60 shadow-lift sm:p-6"
        >
          {active === "Jobs" && <JobsPanel />}
          {active === "Customers" && <CustomersPanel />}
          {active === "Calendar" && <CleanCalendarMock />}
          {active === "Payments" && <PaymentsPanel />}
          {active === "Client portal" && <BookingPortalDemo />}
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          {active === "Client portal"
            ? "Interactive demo — this is the booking experience your customers would get, branded as your business."
            : "Product preview — final interface may evolve before launch."}
        </p>
      </div>
    </Section>
  );
}

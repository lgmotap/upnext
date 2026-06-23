"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Check, Clock } from "lucide-react";
import { services, business, formatMoney } from "@/lib/mock/data";

const days = [
  { label: "Mon", date: "16" },
  { label: "Tue", date: "17" },
  { label: "Wed", date: "18" },
  { label: "Thu", date: "19" },
  { label: "Fri", date: "20" },
];
const times = ["8:00 AM", "9:30 AM", "11:00 AM", "1:30 PM", "3:00 PM"];

export default function PublicBookingPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = use(params);
  const bookable = services.filter((s) => s.isPublic);
  const [service, setService] = useState(bookable[0].id);
  const [day, setDay] = useState(days[1].date);
  const [time, setTime] = useState(times[2]);

  return (
    <div className="min-h-screen bg-background py-10 text-ink-900">
      <div className="mx-auto max-w-2xl px-5">
        {/* business header */}
        <div className="overflow-hidden rounded-3xl bg-brand-950 p-6 text-white shadow-float sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-400 text-lg font-bold text-brand-950">
              {business.name.charAt(0)}
            </span>
            <div>
              <h1 className="text-xl font-bold">{business.name}</h1>
              <p className="text-sm text-white/60">{business.serviceArea} · Book in under a minute</p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {/* service */}
          <Section step="1" title="Choose a service">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {bookable.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setService(s.id)}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                    service === s.id ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400" : "border-ink-200 bg-white hover:border-brand-300"
                  }`}
                >
                  <div>
                    <p className="font-semibold text-ink-950">{s.name}</p>
                    <p className="inline-flex items-center gap-1 text-xs text-ink-500">
                      <Clock className="size-3" /> {s.durationMinutes} min
                    </p>
                  </div>
                  <span className="text-sm font-bold text-ink-950">{formatMoney(s.priceCents)}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* day */}
          <Section step="2" title="Pick a day">
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setDay(d.date)}
                  className={`flex w-16 flex-col items-center rounded-2xl border py-3 transition ${
                    day === d.date ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400" : "border-ink-200 bg-white hover:border-brand-300"
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase text-ink-400">{d.label}</span>
                  <span className="text-lg font-bold text-ink-950">{d.date}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* time */}
          <Section step="3" title="Pick a time">
            <div className="flex flex-wrap gap-2">
              {times.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    time === t ? "border-brand-400 bg-brand-400 text-brand-950" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Section>

          <Link
            href={`/book/${businessSlug}/confirmation/bk_new`}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-4 text-base font-bold text-brand-950 transition hover:bg-brand-300"
          >
            <Check className="size-5" /> Request booking
          </Link>
          <p className="pb-6 text-center text-xs text-ink-400">
            You'll get a confirmation email. {business.name} will confirm your time shortly.
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-ink-100 shadow-soft sm:p-6">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-400">
        <span className="flex size-5 items-center justify-center rounded-full bg-brand-100 text-[11px] text-brand-700">{step}</span>
        {title}
      </p>
      {children}
    </div>
  );
}

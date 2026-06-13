"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, ChevronRight, MousePointerClick } from "lucide-react";

/**
 * Interactive demo of the customer-facing booking portal, branded as an
 * example cleaning company. Visitors can click through service, date, and
 * time to feel the booking flow their own customers would get.
 */

const services = [
  { name: "Standard Clean", detail: "~2 hours", price: "$120" },
  { name: "Deep Clean", detail: "~4 hours", price: "$220" },
  { name: "Move-out Clean", detail: "~5 hours", price: "$340" },
];

const days = [
  { label: "Mon", date: "16" },
  { label: "Tue", date: "17" },
  { label: "Wed", date: "18" },
  { label: "Thu", date: "19" },
  { label: "Fri", date: "20" },
];

const times = [
  { label: "8:00 AM", booked: false },
  { label: "9:30 AM", booked: true },
  { label: "11:00 AM", booked: false },
  { label: "1:30 PM", booked: false },
  { label: "3:00 PM", booked: true },
];

const stepLabel = "text-[10px] font-bold uppercase tracking-wider text-ink-400";

export function BookingPortalDemo() {
  const [service, setService] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const ready = service && day && time;

  const reset = () => {
    setService(null);
    setDay(null);
    setTime(null);
    setSent(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/70 shadow-lift">
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-rose-300" />
        <span className="size-2.5 rounded-full bg-amber-300" />
        <span className="size-2.5 rounded-full bg-emerald-300" />
        <div className="mx-auto flex h-5 w-48 items-center justify-center rounded-md bg-white text-[9px] text-ink-400 ring-1 ring-ink-100">
          book.sparkleshine.com
        </div>
      </div>

      {/* company header — what the customer sees */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-4 text-white">
        <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold">Sparkle &amp; Shine Cleaning Co.</p>
          <p className="text-[11px] text-brand-100">Book your cleaning in under a minute</p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold sm:flex">
          <MousePointerClick className="size-3" aria-hidden /> Try it — it&apos;s clickable
        </span>
      </div>

      {sent ? (
        <div className="px-6 py-12 text-center" role="status">
          <span className="mb-3 inline-flex size-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <CheckCircle2 className="size-6" aria-hidden />
          </span>
          <p className="font-bold text-ink-950">Request sent!</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink-600">
            Sparkle &amp; Shine will confirm your {service} for {day} at {time} by text shortly.
          </p>
          <p className="mt-2 text-xs text-ink-400">
            …and on the business side, this request just landed in the dashboard.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-full bg-ink-100 px-5 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-200"
          >
            Book another
          </button>
        </div>
      ) : (
        <div className="space-y-5 p-4 sm:p-5">
          {/* step 1: service */}
          <div>
            <p className={`${stepLabel} mb-2`}>1 · Choose a service</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {services.map((s) => {
                const selected = service === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setService(s.name)}
                    aria-pressed={selected}
                    className={`rounded-xl p-3 text-left transition ${
                      selected
                        ? "bg-brand-50 ring-2 ring-brand-500"
                        : "bg-white ring-1 ring-ink-200 hover:ring-brand-300"
                    }`}
                  >
                    <p className="text-sm font-bold text-ink-950">{s.name}</p>
                    <p className="text-xs text-ink-500">{s.detail}</p>
                    <p className={`mt-1 text-sm font-bold ${selected ? "text-brand-700" : "text-ink-700"}`}>
                      {s.price}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* step 2: date */}
          <div>
            <p className={`${stepLabel} mb-2`}>2 · Pick a day</p>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => {
                const label = `${d.label} ${d.date}`;
                const selected = day === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setDay(label)}
                    aria-pressed={selected}
                    className={`min-w-14 rounded-xl px-3 py-2 text-center transition ${
                      selected
                        ? "bg-brand-600 text-white shadow-md"
                        : "bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-brand-300"
                    }`}
                  >
                    <span className="block text-[10px] font-semibold opacity-70">{d.label}</span>
                    <span className="block text-sm font-bold">{d.date}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* step 3: time */}
          <div>
            <p className={`${stepLabel} mb-2`}>3 · Pick a time</p>
            <div className="flex flex-wrap gap-2">
              {times.map((t) => {
                const selected = time === t.label;
                return (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => !t.booked && setTime(t.label)}
                    disabled={t.booked}
                    aria-pressed={selected}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                      t.booked
                        ? "cursor-not-allowed bg-ink-50 text-ink-300 line-through"
                        : selected
                          ? "bg-brand-600 text-white shadow-md"
                          : "bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-brand-300"
                    }`}
                  >
                    {t.label}
                    {t.booked && <span className="ml-1 no-underline">· booked</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* summary + CTA */}
          <div className="flex flex-col items-stretch gap-3 rounded-xl bg-ink-50/70 p-3 ring-1 ring-ink-100 sm:flex-row sm:items-center">
            <p className="flex-1 text-sm text-ink-600">
              {ready ? (
                <>
                  <span className="font-bold text-ink-950">{service}</span> · {day} · {time} ·{" "}
                  <span className="font-bold text-brand-700">
                    {services.find((s) => s.name === service)?.price}
                  </span>
                </>
              ) : (
                "Select a service, day, and time to continue"
              )}
            </p>
            <button
              type="button"
              onClick={() => ready && setSent(true)}
              disabled={!ready}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition ${
                ready
                  ? "bg-brand-600 text-white shadow-md hover:bg-brand-700"
                  : "cursor-not-allowed bg-ink-100 text-ink-400"
              }`}
            >
              Request booking <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

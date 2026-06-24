"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Clock, Plus } from "lucide-react";
import { BookingMonthCalendar } from "@/components/booking/BookingMonthCalendar";
import { formatMoney } from "@/lib/money/format";
import { monthKeyFromYmd } from "@/lib/availability/calendar-ui";
import { submitPublicBookingAction } from "@/server/actions/public-booking";
import {
  fetchAvailableDaysAction,
  fetchSlotsForDayAction,
} from "@/server/actions/public-booking-slots";
import type { PublicBusiness, PublicService, SlotDay, SlotOption } from "./types";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

function computeTotals(primary: PublicService | undefined, addons: PublicService[]) {
  if (!primary) return { priceCents: 0, durationMinutes: 0, currency: "USD" };
  const priceCents = primary.basePriceCents + addons.reduce((s, a) => s + a.basePriceCents, 0);
  const durationMinutes = primary.durationMinutes + addons.reduce((s, a) => s + a.durationMinutes, 0);
  return { priceCents, durationMinutes, currency: primary.currency };
}

export function PublicBookingClient({
  businessSlug,
  timeZone,
  business,
  primaryServices,
  addonServices,
  initialDays,
  initialSlots,
  initialServiceId,
  initialDate,
  initialTime,
}: {
  businessSlug: string;
  timeZone: string;
  business: PublicBusiness;
  primaryServices: PublicService[];
  addonServices: PublicService[];
  initialDays: SlotDay[];
  initialSlots: SlotOption[];
  initialServiceId: string;
  initialDate: string;
  initialTime: string;
}) {
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [days, setDays] = useState(initialDays);
  const [slots, setSlots] = useState(initialSlots);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [viewMonth, setViewMonth] = useState(
    () => initialDays[0]?.monthKey ?? monthKeyFromYmd(new Date().toISOString().slice(0, 10)),
  );
  const [pending, startTransition] = useTransition();

  const addonKey = addonIds.slice().sort().join(",");

  const selectedPrimary = primaryServices.find((s) => s.id === serviceId);
  const selectedAddons = addonServices.filter((a) => addonIds.includes(a.id));
  const totals = useMemo(
    () => computeTotals(selectedPrimary, selectedAddons),
    [selectedPrimary, selectedAddons],
  );

  useEffect(() => {
    startTransition(async () => {
      const { days: nextDays, timeZone: tz } = await fetchAvailableDaysAction(
        businessSlug,
        serviceId,
        addonKey || undefined,
      );
      setDays(nextDays);
      const nextDate = nextDays.find((d) => d.date === date)?.date ?? nextDays[0]?.date ?? "";
      setDate(nextDate);
      if (nextDate) {
        setViewMonth(monthKeyFromYmd(nextDate));
        const { slots: nextSlots } = await fetchSlotsForDayAction(
          businessSlug,
          serviceId,
          nextDate,
          addonKey || undefined,
        );
        setSlots(nextSlots);
        setTime(nextSlots.find((s) => s.time === time)?.time ?? nextSlots[0]?.time ?? "");
      } else {
        setSlots([]);
        setTime("");
      }
      void tz;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when service or addons change
  }, [businessSlug, serviceId, addonKey]);

  function selectDate(nextDate: string) {
    setDate(nextDate);
    setViewMonth(monthKeyFromYmd(nextDate));
    startTransition(async () => {
      const { slots: nextSlots } = await fetchSlotsForDayAction(
        businessSlug,
        serviceId,
        nextDate,
        addonKey || undefined,
      );
      setSlots(nextSlots);
      setTime(nextSlots[0]?.time ?? "");
    });
  }

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="min-h-screen bg-background py-8 text-ink-900 sm:py-10">
      <div className="mx-auto max-w-2xl px-4 sm:px-5">
        <header className="overflow-hidden rounded-3xl bg-brand-950 p-6 text-white shadow-float sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-400 text-lg font-bold text-brand-950">
              {business.displayName.charAt(0)}
            </span>
            <div>
              <h1 className="text-xl font-bold">{business.displayName}</h1>
              <p className="text-sm text-white/60">
                {business.serviceArea ? `${business.serviceArea} · ` : ""}
                Book online in a few steps
              </p>
            </div>
          </div>
        </header>

        <form action={submitPublicBookingAction} className="mt-4 space-y-4">
          <input type="hidden" name="businessSlug" value={businessSlug} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />
          {addonIds.map((id) => (
            <input key={id} type="hidden" name="addonServiceIds" value={id} />
          ))}

          <Section step="1" title="Choose your service">
            <p className="mb-3 text-sm text-ink-500">Select one main service for your visit.</p>
            <div className="grid gap-2.5">
              {primaryServices.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                    serviceId === s.id
                      ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400"
                      : "border-ink-200 bg-white hover:border-brand-300"
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-semibold text-ink-950">{s.name}</p>
                    {s.description && (
                      <p className="mt-0.5 text-xs text-ink-500 line-clamp-2">{s.description}</p>
                    )}
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500">
                      <Clock className="size-3" /> {s.durationMinutes} min
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-ink-950">
                    {formatMoney(s.basePriceCents, s.currency)}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {addonServices.length > 0 && (
            <Section step="2" title="Add extras (optional)">
              <p className="mb-3 text-sm text-ink-500">
                Enhance your booking with optional add-ons. Time and price update automatically.
              </p>
              <div className="space-y-2">
                {addonServices.map((a) => {
                  const checked = addonIds.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl border p-4 transition ${
                        checked
                          ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400"
                          : "border-ink-200 bg-white hover:border-brand-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAddon(a.id)}
                          className="mt-1 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
                        />
                        <div>
                          <p className="flex items-center gap-1.5 font-semibold text-ink-950">
                            <Plus className="size-3.5 text-brand-600" />
                            {a.name}
                          </p>
                          {a.description && (
                            <p className="mt-0.5 text-xs text-ink-500">{a.description}</p>
                          )}
                          <p className="mt-1 text-xs text-ink-500">+{a.durationMinutes} min</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-ink-950">
                        +{formatMoney(a.basePriceCents, a.currency)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Section>
          )}

          <Section step={addonServices.length > 0 ? "3" : "2"} title="Pick a date">
            <BookingMonthCalendar
              days={days}
              selectedDate={date}
              viewMonth={viewMonth}
              timeZone={timeZone}
              pending={pending}
              onSelectDate={selectDate}
              onViewMonthChange={setViewMonth}
            />
          </Section>

          <Section step={addonServices.length > 0 ? "4" : "3"} title="Pick a time">
            {slots.length === 0 ? (
              <p className="text-sm text-ink-500">
                {pending ? "Loading available times…" : "No times available on this date. Try another day."}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((t) => (
                  <button
                    key={t.time}
                    type="button"
                    onClick={() => setTime(t.time)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                      time === t.time
                        ? "border-brand-400 bg-brand-400 text-brand-950"
                        : "border-ink-200 bg-white text-ink-700 hover:border-brand-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </Section>

          <Section step={addonServices.length > 0 ? "5" : "4"} title="Your details">
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="firstName" required placeholder="First name" className={input} />
              <input name="lastName" required placeholder="Last name" className={input} />
              <input name="email" type="email" required placeholder="Email" className={`sm:col-span-2 ${input}`} />
              <input name="phone" type="tel" placeholder="Phone (optional)" className={`sm:col-span-2 ${input}`} />
              <input name="line1" required placeholder="Street address" className={`sm:col-span-2 ${input}`} />
              <input name="line2" placeholder="Apt / suite (optional)" className={`sm:col-span-2 ${input}`} />
              <input name="city" required placeholder="City" className={input} />
              <input name="region" required placeholder="State / region" className={input} />
              <input name="postalCode" required placeholder="ZIP / postal code" className={input} />
              <textarea
                name="customerNotes"
                rows={2}
                placeholder="Notes for the team (optional)"
                className={`sm:col-span-2 ${input}`}
              />
            </div>
          </Section>

          {selectedPrimary && (
            <div className="rounded-2xl bg-ink-50 px-4 py-3 text-sm ring-1 ring-ink-100">
              <div className="flex justify-between font-semibold text-ink-900">
                <span>{selectedPrimary.name}</span>
                <span>{formatMoney(selectedPrimary.basePriceCents, selectedPrimary.currency)}</span>
              </div>
              {selectedAddons.map((a) => (
                <div key={a.id} className="mt-1 flex justify-between text-ink-600">
                  <span>+ {a.name}</span>
                  <span>{formatMoney(a.basePriceCents, a.currency)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-ink-200 pt-2 font-bold text-ink-950">
                <span>Total · {totals.durationMinutes} min</span>
                <span>{formatMoney(totals.priceCents, totals.currency)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!date || !time || !selectedPrimary || pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-4 text-base font-bold text-brand-950 transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="size-5" /> Request booking
            {selectedPrimary && (
              <span className="text-sm font-semibold opacity-80">
                · {formatMoney(totals.priceCents, totals.currency)}
              </span>
            )}
          </button>
          <p className="pb-6 text-center text-xs text-ink-400">
            You&apos;ll get a confirmation email. {business.displayName} will confirm your time shortly.
          </p>
        </form>
      </div>
    </div>
  );
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-ink-100 shadow-soft sm:p-6">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-400">
        <span className="flex size-5 items-center justify-center rounded-full bg-brand-100 text-[11px] text-brand-700">
          {step}
        </span>
        {title}
      </p>
      {children}
    </div>
  );
}

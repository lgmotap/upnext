"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertCircle, Check, Clock, Plus, Repeat } from "lucide-react";
import { BookingMonthCalendar } from "@/components/booking/BookingMonthCalendar";
import { BOOKING_FREQUENCY_OPTIONS } from "@/lib/booking/frequency";
import { formatMoney } from "@/lib/money/format";
import { monthKeyFromYmd } from "@/lib/availability/calendar-ui";
import { submitPublicBookingAction } from "@/server/actions/public-booking";
import {
  fetchAvailableDaysAction,
  fetchSlotsForDayAction,
} from "@/server/actions/public-booking-slots";
import type { PublicBusiness, PublicService, SlotDay, SlotOption } from "./types";
import type { BookingFrequency, PricingParameterType } from "@/generated/prisma/client";
import { PricingParametersFields } from "@/components/booking/PricingParametersFields";
import {
  bookingPriceCents,
  defaultParameterValues,
  type PricingParameterConfig,
} from "@/lib/pricing/parameters";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

function computeTotals(
  primary: PublicService | undefined,
  addons: PublicService[],
  paramConfigs: PricingParameterConfig[],
  paramValues: Partial<Record<PricingParameterType, number>>,
) {
  if (!primary) return { priceCents: 0, durationMinutes: 0, currency: "USD" };
  const addonTotal = addons.reduce((s, a) => s + a.basePriceCents, 0);
  const priceCents = bookingPriceCents(primary.basePriceCents, addonTotal, paramConfigs, paramValues);
  const durationMinutes = primary.durationMinutes + addons.reduce((s, a) => s + a.durationMinutes, 0);
  return { priceCents, durationMinutes, currency: primary.currency };
}

function buildSteps(hasAddons: boolean, hasParams: boolean) {
  let n = 1;
  const next = () => String(n++);
  return {
    service: next(),
    addons: hasAddons ? next() : null,
    params: hasParams ? next() : null,
    frequency: next(),
    date: next(),
    time: next(),
    details: next(),
  };
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
  prefill,
  error,
  embedded = false,
  returnPath = "full",
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
  prefill?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    customerNotes?: string;
  };
  error?: string;
  embedded?: boolean;
  returnPath?: "embed" | "full";
}) {
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<BookingFrequency>("one_time");
  const [days, setDays] = useState(initialDays);
  const [slots, setSlots] = useState(initialSlots);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [viewMonth, setViewMonth] = useState(
    () => initialDays[0]?.monthKey ?? monthKeyFromYmd(new Date().toISOString().slice(0, 10)),
  );
  const [pending, startTransition] = useTransition();

  const selectedPrimary = primaryServices.find((s) => s.id === serviceId);
  const selectedAddons = addonServices.filter((a) => addonIds.includes(a.id));
  const paramConfigs = selectedPrimary?.pricingParameters ?? [];
  const [paramValues, setParamValues] = useState<Record<PricingParameterType, number>>(() =>
    defaultParameterValues(paramConfigs) as Record<PricingParameterType, number>,
  );

  const steps = useMemo(
    () => buildSteps(addonServices.length > 0, paramConfigs.length > 0),
    [addonServices.length, paramConfigs.length],
  );
  const addonKey = addonIds.slice().sort().join(",");

  const totals = useMemo(
    () => computeTotals(selectedPrimary, selectedAddons, paramConfigs, paramValues),
    [selectedPrimary, selectedAddons, paramConfigs, paramValues],
  );

  useEffect(() => {
    setParamValues(defaultParameterValues(paramConfigs) as Record<PricingParameterType, number>);
  }, [serviceId, paramConfigs.length]);

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
    <div className={embedded ? "bg-transparent text-ink-900" : "min-h-screen bg-background py-6 text-ink-900 sm:py-10"}>
      <div className={embedded ? "px-1" : "mx-auto max-w-2xl px-4 sm:px-5"}>
        {!embedded && (
          <header className="overflow-hidden rounded-3xl bg-brand-950 p-5 text-white shadow-float sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand-400 text-lg font-bold text-brand-950">
                {business.displayName.charAt(0)}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold">{business.displayName}</h1>
                <p className="text-sm text-white/60">
                  {business.serviceArea ? `${business.serviceArea} · ` : ""}
                  Book online in a few steps
                </p>
              </div>
            </div>
          </header>
        )}

        {embedded && (
          <div className="mb-4 border-b border-ink-100 pb-3">
            <h1 className="text-lg font-bold text-ink-950">{business.displayName}</h1>
            {business.serviceArea && (
              <p className="text-sm text-ink-500">{business.serviceArea}</p>
            )}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className={`flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100 ${embedded ? "mb-4" : "mt-4"}`}
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form action={submitPublicBookingAction} className={embedded ? "space-y-3" : "mt-4 space-y-4"}>
          <input type="hidden" name="businessSlug" value={businessSlug} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={time} />
          <input type="hidden" name="frequency" value={frequency} />
          <input type="hidden" name="returnPath" value={returnPath} />
          {addonIds.map((id) => (
            <input key={id} type="hidden" name="addonServiceIds" value={id} />
          ))}

          <Section step={steps.service} title="Choose your service">
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
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-500">{s.description}</p>
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

          {steps.addons && addonServices.length > 0 && (
            <Section step={steps.addons} title="Add-ons & extras (optional)">
              <p className="mb-3 text-sm text-ink-500">
                Optional extras — time and price update automatically.
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

          {steps.params && paramConfigs.length > 0 && (
            <Section step={steps.params} title="Home size">
              <p className="mb-3 text-sm text-ink-500">
                Your base price includes some bedrooms and bathrooms; extra units are added to the total.
              </p>
              <PricingParametersFields
                configs={paramConfigs}
                values={paramValues}
                onChange={(type, units) => setParamValues((prev) => ({ ...prev, [type]: units }))}
              />
            </Section>
          )}

          <Section step={steps.frequency} title="How often?">
            <p className="mb-3 text-sm text-ink-500">
              Recurring schedules are noted on your request. Your provider will confirm details.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {BOOKING_FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={`rounded-2xl border p-3.5 text-left transition ${
                    frequency === opt.value
                      ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400"
                      : "border-ink-200 bg-white hover:border-brand-300"
                  }`}
                >
                  <p className="flex items-center gap-1.5 font-semibold text-ink-950">
                    <Repeat className="size-3.5 text-brand-600" />
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">{opt.description}</p>
                </button>
              ))}
            </div>
          </Section>

          <Section step={steps.date} title="Pick a date">
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

          <Section step={steps.time} title="Pick a time">
            {slots.length === 0 ? (
              <p className="text-sm text-ink-500">
                {pending ? "Loading available times…" : "No times on this date — try another day."}
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

          <Section step={steps.details} title="Your details">
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="firstName" required placeholder="First name" defaultValue={prefill?.firstName} className={input} />
              <input name="lastName" required placeholder="Last name" defaultValue={prefill?.lastName} className={input} />
              <input name="email" type="email" required placeholder="Email" defaultValue={prefill?.email} className={`sm:col-span-2 ${input}`} />
              <input name="phone" type="tel" placeholder="Phone (optional)" defaultValue={prefill?.phone} className={`sm:col-span-2 ${input}`} />
              <input name="line1" required placeholder="Street address" defaultValue={prefill?.line1} className={`sm:col-span-2 ${input}`} />
              <input name="line2" placeholder="Apt / suite (optional)" defaultValue={prefill?.line2} className={`sm:col-span-2 ${input}`} />
              <input name="city" required placeholder="City" defaultValue={prefill?.city} className={input} />
              <input name="region" required placeholder="State / region" defaultValue={prefill?.region} className={input} />
              <input name="postalCode" required placeholder="ZIP / postal code" defaultValue={prefill?.postalCode} className={input} />
              <textarea
                name="customerNotes"
                rows={2}
                placeholder="Notes for the team (optional)"
                defaultValue={prefill?.customerNotes}
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
                <span>
                  Total · {totals.durationMinutes} min
                  {frequency !== "one_time" && (
                    <span className="ml-1 text-xs font-semibold text-brand-700">
                      · {BOOKING_FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.label}
                    </span>
                  )}
                </span>
                <span>{formatMoney(totals.priceCents, totals.currency)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!date || !time || !selectedPrimary || pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-400 py-3.5 text-base font-bold text-brand-950 transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
          >
            <Check className="size-5" /> Request booking
            {selectedPrimary && (
              <span className="text-sm font-semibold opacity-80">
                · {formatMoney(totals.priceCents, totals.currency)}
              </span>
            )}
          </button>
          <p className={`text-center text-xs text-ink-400 ${embedded ? "" : "pb-4"}`}>
            You&apos;ll get a confirmation email. {business.displayName} will confirm your time shortly.
          </p>
        </form>
      </div>
    </div>
  );
}

function Section({ step, title, children }: { step: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-4 ring-1 ring-ink-100 shadow-soft sm:p-6">
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

"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronDown, Clock, CreditCard, Plus, UserPlus, Repeat } from "lucide-react";
import { BookingMonthCalendar } from "@/components/booking/BookingMonthCalendar";
import { CustomBookingFields } from "@/components/booking/CustomBookingFields";
import { BOOKING_FREQUENCY_OPTIONS } from "@/lib/booking/frequency";
import { formatMoney } from "@/lib/money/format";
import { monthKeyFromYmd, type BookableDay } from "@/lib/availability/calendar-ui";
import { formatDisplayDateTime, localDateTimeToUtc } from "@/lib/datetime/timezone";
import { submitManualBookingAction } from "@/server/actions/manual-booking";
import {
  fetchManualAvailableDaysAction,
  fetchManualSlotsForDayAction,
} from "@/server/actions/manual-booking-slots";
import type { BookingFormField, BookingFrequency, PricingParameterType } from "@/generated/prisma/client";
import { PricingParametersFields } from "@/components/booking/PricingParametersFields";
import { AddressAutocompleteFields } from "@/components/maps/AddressAutocompleteFields";
import {
  bookingPriceCents,
  defaultParameterValues,
  type PricingParameterConfig,
} from "@/lib/pricing/parameters";
import {
  applyFrequencyDiscount,
  discountLabelForFrequency,
  type FrequencyDiscountConfig,
} from "@/lib/pricing/frequency-discount";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

type ServiceOption = {
  id: string;
  name: string;
  durationMinutes: number;
  basePriceCents: number;
  currency: string;
  description: string | null;
  pricingParameters: PricingParameterConfig[];
  frequencyDiscounts: FrequencyDiscountConfig[];
};

type CustomerOption = {
  id: string;
  label: string;
  email: string;
  addresses: Array<{ id: string; label: string; isDefault: boolean }>;
};

type MemberOption = {
  id: string;
  label: string;
  role: string;
};

type LocationOption = {
  id: string;
  label: string;
  isDefault: boolean;
};

type SlotOption = { date: string; time: string; label: string };

function computeTotals(
  primary: ServiceOption | undefined,
  addons: ServiceOption[],
  paramConfigs: PricingParameterConfig[],
  paramValues: Partial<Record<PricingParameterType, number>>,
  frequency: BookingFrequency,
) {
  if (!primary) return { priceCents: 0, durationMinutes: 0, currency: "USD", subtotalCents: 0 };
  const addonTotal = addons.reduce((s, a) => s + a.basePriceCents, 0);
  const subtotalCents = bookingPriceCents(primary.basePriceCents, addonTotal, paramConfigs, paramValues);
  const priceCents = applyFrequencyDiscount(subtotalCents, frequency, primary.frequencyDiscounts);
  const durationMinutes = primary.durationMinutes + addons.reduce((s, a) => s + a.durationMinutes, 0);
  return { priceCents, subtotalCents, durationMinutes, currency: primary.currency };
}

export function ManualBookingClient({
  timeZone,
  primaryServices,
  addonServices,
  customers,
  assignableMembers,
  initialDays,
  initialSlots,
  initialServiceId,
  initialCustomerId = "",
  initialDate,
  initialTime,
  customFormFields = [],
  payAtBooking = { showPaymentStep: false, requirePaymentAtBooking: false },
  serviceAreaEnforcementEnabled = false,
  locations = [],
}: {
  timeZone: string;
  primaryServices: ServiceOption[];
  addonServices: ServiceOption[];
  customers: CustomerOption[];
  assignableMembers: MemberOption[];
  initialDays: BookableDay[];
  initialSlots: SlotOption[];
  initialServiceId: string;
  initialCustomerId?: string;
  initialDate: string;
  initialTime: string;
  customFormFields?: BookingFormField[];
  payAtBooking?: { showPaymentStep: boolean; requirePaymentAtBooking: boolean };
  serviceAreaEnforcementEnabled?: boolean;
  locations?: LocationOption[];
}) {
  const defaultLocationId =
    locations.find((l) => l.isDefault)?.id ?? locations[0]?.id ?? "";
  const [locationId, setLocationId] = useState(defaultLocationId);
  const [customerMode, setCustomerMode] = useState<"existing" | "new">(
    customers.length > 0 ? "existing" : "new",
  );
  const [customerId, setCustomerId] = useState(
    initialCustomerId && customers.some((c) => c.id === initialCustomerId)
      ? initialCustomerId
      : (customers[0]?.id ?? ""),
  );
  const [serviceId, setServiceId] = useState(initialServiceId);
  const [frequency, setFrequency] = useState<BookingFrequency>("one_time");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [days, setDays] = useState<BookableDay[]>(initialDays);
  const [slots, setSlots] = useState(initialSlots);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [viewMonth, setViewMonth] = useState(
    () => initialDays[0]?.monthKey ?? monthKeyFromYmd(new Date().toISOString().slice(0, 10)),
  );
  const [pending, startTransition] = useTransition();
  const [assignMembershipId, setAssignMembershipId] = useState("");
  const [customerAddressId, setCustomerAddressId] = useState("");
  const [paymentMode, setPaymentMode] = useState<"bill_later" | "collect_now">("bill_later");
  const [overrideServiceArea, setOverrideServiceArea] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedMember = assignableMembers.find((m) => m.id === assignMembershipId);
  const frequencyLabel =
    BOOKING_FREQUENCY_OPTIONS.find((o) => o.value === frequency)?.label ?? frequency;
  const whenLabel =
    date && time
      ? formatDisplayDateTime(localDateTimeToUtc(date, time, timeZone), timeZone)
      : "—";

  const defaultAddressIdForCustomer = useMemo(() => {
    if (!selectedCustomer?.addresses.length) return "";
    return (
      selectedCustomer.addresses.find((a) => a.isDefault)?.id ??
      selectedCustomer.addresses[0]?.id ??
      ""
    );
  }, [selectedCustomer]);

  const effectiveCustomerAddressId =
    customerMode !== "existing" || !selectedCustomer
      ? ""
      : customerAddressId &&
          selectedCustomer.addresses.some((a) => a.id === customerAddressId)
        ? customerAddressId
        : defaultAddressIdForCustomer;

  const addonKey = addonIds.slice().sort().join(",");
  const selectedPrimary = primaryServices.find((s) => s.id === serviceId);
  const selectedAddons = addonServices.filter((a) => addonIds.includes(a.id));
  const paramConfigs = selectedPrimary?.pricingParameters ?? [];
  const [paramValues, setParamValues] = useState<Record<PricingParameterType, number>>(() =>
    defaultParameterValues(paramConfigs) as Record<PricingParameterType, number>,
  );
  const totals = useMemo(
    () => computeTotals(selectedPrimary, selectedAddons, paramConfigs, paramValues, frequency),
    [selectedPrimary, selectedAddons, paramConfigs, paramValues, frequency],
  );

  function selectService(nextId: string) {
    setServiceId(nextId);
    const next = primaryServices.find((s) => s.id === nextId);
    setParamValues(
      defaultParameterValues(next?.pricingParameters ?? []) as Record<PricingParameterType, number>,
    );
  }

  useEffect(() => {
    if (!serviceId) return;
    startTransition(async () => {
      const { days: nextDays, timeZone: tz } = await fetchManualAvailableDaysAction(
        serviceId,
        addonKey || undefined,
        assignMembershipId || undefined,
      );
      setDays(nextDays);
      const nextDate = nextDays.find((d) => d.date === date)?.date ?? nextDays[0]?.date ?? "";
      setDate(nextDate);
      if (nextDate) {
        setViewMonth(monthKeyFromYmd(nextDate));
        const { slots: nextSlots } = await fetchManualSlotsForDayAction(
          serviceId,
          nextDate,
          addonKey || undefined,
          assignMembershipId || undefined,
        );
        setSlots(nextSlots);
        setTime(nextSlots.find((s) => s.time === time)?.time ?? nextSlots[0]?.time ?? "");
      } else {
        setSlots([]);
        setTime("");
      }
      void tz;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when service, addons, or worker change
  }, [serviceId, addonKey, assignMembershipId]);

  function selectDate(nextDate: string) {
    setDate(nextDate);
    setViewMonth(monthKeyFromYmd(nextDate));
    startTransition(async () => {
      const { slots: nextSlots } = await fetchManualSlotsForDayAction(
        serviceId,
        nextDate,
        addonKey || undefined,
        assignMembershipId || undefined,
      );
      setSlots(nextSlots);
      setTime(nextSlots[0]?.time ?? "");
    });
  }

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (primaryServices.length === 0) {
    return (
      <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
        Add at least one active service before creating a manual booking.
      </p>
    );
  }

  return (
    <form action={submitManualBookingAction} className="space-y-4">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="time" value={time} />
      <input type="hidden" name="frequency" value={frequency} />
      {customerMode === "existing" && customerId ? (
        <input type="hidden" name="customerId" value={customerId} />
      ) : null}
      {customerMode === "existing" && effectiveCustomerAddressId ? (
        <input type="hidden" name="customerAddressId" value={effectiveCustomerAddressId} />
      ) : null}
      {addonIds.map((id) => (
        <input key={id} type="hidden" name="addonServiceIds" value={id} />
      ))}
      {locations.length > 1 && locationId ? (
        <input type="hidden" name="locationId" value={locationId} />
      ) : null}

      {locations.length > 1 && (
        <Section title="Location" step="1">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              Service location
            </span>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className={`${input} mt-1`}
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.label}
                </option>
              ))}
            </select>
          </label>
        </Section>
      )}

      <Section title="Customer" step={locations.length > 1 ? "2" : "1"}>
        <div className="mb-4 flex flex-wrap gap-2">
          <ModeButton
            active={customerMode === "existing"}
            onClick={() => setCustomerMode("existing")}
            disabled={customers.length === 0}
          >
            Existing customer
          </ModeButton>
          <ModeButton active={customerMode === "new"} onClick={() => setCustomerMode("new")}>
            <UserPlus className="size-4" /> New customer
          </ModeButton>
        </div>

        {customerMode === "existing" ? (
          customers.length === 0 ? (
            <p className="text-sm text-ink-500">No customers yet — add a new customer below.</p>
          ) : (
            <div className="space-y-3">
              <select
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setCustomerAddressId("");
                }}
                className={input}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} · {c.email}
                  </option>
                ))}
              </select>
              {selectedCustomer && selectedCustomer.addresses.length > 1 ? (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
                    Service address
                  </label>
                  <select
                    value={effectiveCustomerAddressId}
                    onChange={(e) => setCustomerAddressId(e.target.value)}
                    className={input}
                    required
                  >
                    {selectedCustomer.addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                        {a.isDefault ? " (default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : selectedCustomer?.addresses[0] ? (
                <p className="text-sm text-ink-500">{selectedCustomer.addresses[0].label}</p>
              ) : null}
            </div>
          )
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" name="firstName" required />
            <Field label="Last name" name="lastName" required />
            <div className="sm:col-span-2">
              <Field label="Email" name="email" type="email" required />
            </div>
            <Field label="Phone" name="phone" />
            <AddressAutocompleteFields
              compact
              className="sm:col-span-2 grid gap-3 sm:grid-cols-2"
              defaults={{ line1: "", line2: "", city: "", region: "", postalCode: "" }}
              line1Name="line1"
              line2Name="line2"
              regionAsSelect
              idPrefix="manual-book-addr"
            />
          </div>
        )}
      </Section>

      <Section title="Service" step="2">
        <div className="grid gap-2.5">
          {primaryServices.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => selectService(s.id)}
              className={`flex items-start justify-between rounded-2xl px-4 py-3.5 text-left ring-1 transition ${
                serviceId === s.id
                  ? "bg-brand-50 ring-brand-300"
                  : "bg-white ring-ink-200 hover:ring-ink-300"
              }`}
            >
              <div>
                <p className="font-semibold text-ink-950">{s.name}</p>
                {s.description && <p className="mt-0.5 text-sm text-ink-500">{s.description}</p>}
                <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                  <Clock className="size-3.5" /> {s.durationMinutes} min
                </p>
              </div>
              <span className="text-sm font-bold text-ink-800">
                {formatMoney(s.basePriceCents, s.currency)}
              </span>
            </button>
          ))}
        </div>

        {addonServices.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-ink-700">Add-ons (optional)</p>
            <div className="flex flex-wrap gap-2">
              {addonServices.map((a) => {
                const selected = addonIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAddon(a.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ${
                      selected
                        ? "bg-brand-100 text-brand-900 ring-brand-200"
                        : "bg-white text-ink-600 ring-ink-200 hover:bg-ink-50"
                    }`}
                  >
                    {selected ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    {a.name} (+{formatMoney(a.basePriceCents, a.currency)})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {paramConfigs.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-ink-700">Home size</p>
            <PricingParametersFields
              configs={paramConfigs}
              values={paramValues}
              onChange={(type, units) => setParamValues((prev) => ({ ...prev, [type]: units }))}
            />
          </div>
        )}

        <p className="mt-3 text-sm text-ink-500">
          Estimated total:{" "}
          <span className="font-semibold text-ink-800">
            {formatMoney(totals.priceCents, totals.currency)}
          </span>{" "}
          · {totals.durationMinutes} min
        </p>
      </Section>

      <Section title="How often?" step="3">
        <div className="grid gap-2 sm:grid-cols-2">
          {BOOKING_FREQUENCY_OPTIONS.map((opt) => {
            const badge =
              selectedPrimary && opt.value !== "one_time"
                ? discountLabelForFrequency(opt.value, selectedPrimary.frequencyDiscounts)
                : null;
            return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFrequency(opt.value)}
              className={`rounded-2xl border p-3 text-left transition ${
                frequency === opt.value
                  ? "border-brand-400 bg-brand-50 ring-1 ring-brand-400"
                  : "border-ink-200 bg-white hover:border-brand-300"
              }`}
            >
              <p className="flex items-center gap-1.5 font-semibold text-ink-950">
                <Repeat className="size-3.5 text-brand-600" />
                {opt.label}
                {badge && (
                  <span className="ml-1 rounded-full bg-brand-200 px-2 py-0.5 text-[10px] font-bold text-brand-900">
                    {badge}
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-ink-500">{opt.description}</p>
            </button>
          );
          })}
        </div>
      </Section>

      <Section title="Date & time" step="4">
        {days.length === 0 ? (
          <p className="text-sm text-ink-500">No available slots for this service. Check availability settings.</p>
        ) : (
          <>
            <BookingMonthCalendar
              days={days}
              selectedDate={date}
              viewMonth={viewMonth}
              timeZone={timeZone}
              onSelectDate={selectDate}
              onViewMonthChange={setViewMonth}
            />
            {slots.length > 0 ? (
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    onClick={() => setTime(s.time)}
                    className={`rounded-xl px-2 py-2 text-sm font-medium ring-1 ${
                      time === s.time
                        ? "bg-brand-400 text-brand-950 ring-brand-400"
                        : "bg-white text-ink-700 ring-ink-200 hover:ring-brand-200"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-ink-500">No times available on this date.</p>
            )}
          </>
        )}
      </Section>

      <Section title="Notes & assignment" step="5">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Customer notes
        </label>
        <textarea
          name="customerNotes"
          rows={2}
          placeholder="Gate code, pets, parking…"
          className={input}
        />

        {assignableMembers.length > 0 && (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              Assign worker (optional)
            </label>
            <select
              name="assignMembershipId"
              value={assignMembershipId}
              onChange={(e) => setAssignMembershipId(e.target.value)}
              className={input}
            >
              <option value="">Unassigned</option>
              {assignableMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.role})
                </option>
              ))}
            </select>
            {assignMembershipId && (
              <p className="mt-1.5 text-xs text-ink-500">
                Available slots are filtered to this worker&apos;s schedule.
              </p>
            )}
          </div>
        )}

        {customFormFields.length > 0 && (
          <div className="mt-4">
            <CustomBookingFields fields={customFormFields} />
          </div>
        )}
      </Section>

      {payAtBooking.showPaymentStep && (
        <Section title="Payment" step="6">
          <div className="space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-ink-200">
              <input
                type="radio"
                name="paymentMode"
                value="bill_later"
                checked={paymentMode === "bill_later"}
                onChange={() => setPaymentMode("bill_later")}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-semibold text-ink-900">Bill later</span>
                <span className="text-xs text-ink-500">
                  Schedule the job now; collect payment from the job or customer profile later.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-200">
              <input
                type="radio"
                name="paymentMode"
                value="collect_now"
                checked={paymentMode === "collect_now"}
                onChange={() => setPaymentMode("collect_now")}
                className="mt-0.5"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  <CreditCard className="size-4 text-brand-700" />
                  Collect payment now
                </span>
                <span className="text-xs text-ink-500">
                  Redirects to Stripe Checkout after the job is created
                  {selectedPrimary ? ` · ${formatMoney(totals.priceCents, totals.currency)}` : ""}.
                </span>
              </span>
            </label>
          </div>
          {payAtBooking.requirePaymentAtBooking && (
            <p className="mt-2 text-xs font-medium text-amber-800">
              Your settings prefer payment at booking — you can still bill later for phone/walk-in orders.
            </p>
          )}
        </Section>
      )}

      <details className="group rounded-2xl bg-white p-5 ring-1 ring-ink-100 shadow-soft">
        <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-ink-950">
          <span>Review booking</span>
          <ChevronDown className="size-4 text-ink-400 transition group-open:rotate-180" />
        </summary>
        <dl className="mt-4 space-y-2 text-sm">
          <ReviewRow
            label="Customer"
            value={
              customerMode === "existing" && selectedCustomer
                ? `${selectedCustomer.label} · ${selectedCustomer.email}`
                : "New customer"
            }
          />
          {customerMode === "existing" && selectedCustomer && (
            <ReviewRow
              label="Address"
              value={
                selectedCustomer.addresses.find((a) => a.id === effectiveCustomerAddressId)
                  ?.label ??
                selectedCustomer.addresses[0]?.label ??
                "—"
              }
            />
          )}
          <ReviewRow label="Service" value={selectedPrimary?.name ?? "—"} />
          {selectedAddons.length > 0 && (
            <ReviewRow label="Add-ons" value={selectedAddons.map((a) => a.name).join(", ")} />
          )}
          <ReviewRow label="Frequency" value={frequencyLabel} />
          <ReviewRow label="When" value={whenLabel} />
          <ReviewRow
            label="Worker"
            value={selectedMember ? `${selectedMember.label} (${selectedMember.role})` : "Unassigned"}
          />
          <ReviewRow
            label="Total"
            value={
              selectedPrimary
                ? `${formatMoney(totals.priceCents, totals.currency)} · ${totals.durationMinutes} min`
                : "—"
            }
          />
          {payAtBooking.showPaymentStep && (
            <ReviewRow
              label="Payment"
              value={paymentMode === "collect_now" ? "Collect now (Stripe)" : "Bill later"}
            />
          )}
        </dl>
      </details>

      {serviceAreaEnforcementEnabled && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
          <input
            type="checkbox"
            name="overrideServiceArea"
            value="1"
            checked={overrideServiceArea}
            onChange={(e) => setOverrideServiceArea(e.target.checked)}
            className="mt-0.5 size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
          />
          <span className="text-sm text-amber-950">
            Book anyway if the service address is outside your configured coverage (phone/walk-in
            exception).
          </span>
        </label>
      )}

      <button
        type="submit"
        disabled={pending || !date || !time || days.length === 0}
        className="w-full rounded-2xl bg-brand-400 px-4 py-3.5 text-sm font-bold text-brand-950 hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Creating job…" : paymentMode === "collect_now" && payAtBooking.showPaymentStep
          ? "Create booking & collect payment"
          : "Create booking & schedule job"}
      </button>
    </form>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-b border-ink-50 pb-2 last:border-0">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-ink-100 shadow-soft">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-ink-950">
        <span className="flex size-6 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-800">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function ModeButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 disabled:opacity-40 ${
        active
          ? "bg-brand-100 text-brand-900 ring-brand-200"
          : "bg-white text-ink-600 ring-ink-200 hover:bg-ink-50"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </label>
      <input name={name} type={type} required={required} className={input} />
    </div>
  );
}

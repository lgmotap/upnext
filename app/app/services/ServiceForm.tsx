import type { Service } from "@/generated/prisma/client";
import { createServiceAction, updateServiceAction } from "@/server/actions/services";
import {
  PRICING_PARAMETER_LABELS,
  PRICING_PARAMETER_LIMITS,
  type PricingParameterConfig,
} from "@/lib/pricing/parameters";
import type { BookingFrequency, PricingParameterType } from "@/generated/prisma/client";
import type { FrequencyDiscountConfig } from "@/lib/pricing/frequency-discount";

const RECURRING_FREQUENCIES: BookingFrequency[] = ["weekly", "biweekly", "monthly"];

const PRICING_FORM_FIELDS: Record<PricingParameterType, { unit: string; included: string }> = {
  bedrooms: { unit: "bedroomUnitPrice", included: "bedroomIncluded" },
  bathrooms: { unit: "bathroomUnitPrice", included: "bathroomIncluded" },
  half_bathrooms: { unit: "halfBathUnitPrice", included: "halfBathIncluded" },
  square_feet: { unit: "sqFtUnitPrice", included: "sqFtIncluded" },
};

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400";

export function ServiceForm({
  service,
  checklistItems = "",
  pricingParameters = [],
  frequencyDiscounts = [],
}: {
  service?: Service;
  checklistItems?: string;
  pricingParameters?: PricingParameterConfig[];
  frequencyDiscounts?: FrequencyDiscountConfig[];
}) {
  const action = service ? updateServiceAction : createServiceAction;
  const priceDollars = service ? (service.basePriceCents / 100).toFixed(2) : "";
  const paramsByType = Object.fromEntries(
    pricingParameters.map((p) => [p.parameterType, p]),
  ) as Partial<Record<PricingParameterType, PricingParameterConfig>>;
  const hasPricingParams = pricingParameters.length > 0;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {service && <input type="hidden" name="serviceId" value={service.id} />}
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Name
        </label>
        <input name="name" required defaultValue={service?.name} className={input} placeholder="Standard Clean" />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Description
        </label>
        <textarea
          name="description"
          rows={2}
          defaultValue={service?.description ?? ""}
          className={input}
          placeholder="Optional short description"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Duration (minutes)
        </label>
        <input
          name="durationMinutes"
          type="number"
          min={15}
          step={15}
          required
          defaultValue={service?.durationMinutes ?? 120}
          className={input}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Price (USD)
        </label>
        <input
          name="priceDollars"
          type="number"
          min={0}
          step={0.01}
          required
          defaultValue={priceDollars}
          className={input}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="isActive" defaultChecked={service?.isActive ?? true} className="rounded" />
        Active (visible to team)
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" name="isPublic" defaultChecked={service?.isPublic ?? true} className="rounded" />
        Public (on booking page)
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
        <input type="checkbox" name="isAddon" defaultChecked={service?.isAddon ?? false} className="rounded" />
        Add-on service (optional extra — not a main booking service)
      </label>
      <div className="sm:col-span-2 rounded-2xl bg-ink-50 p-4 ring-1 ring-ink-100">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-800">
          <input
            type="checkbox"
            name="enablePricingParameters"
            defaultChecked={hasPricingParams}
            className="rounded"
          />
          Home-size pricing parameters
        </label>
        <p className="mt-1 text-xs text-ink-500">
          Base price covers included units; customers pay extra per unit above that on booking.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(PRICING_FORM_FIELDS) as PricingParameterType[]).map((parameterType) => {
            const fields = PRICING_FORM_FIELDS[parameterType];
            const limits = PRICING_PARAMETER_LIMITS[parameterType];
            const row = paramsByType[parameterType];
            const defaultUnitDollars =
              parameterType === "square_feet"
                ? (limits.defaultUnitPriceCents / 100).toFixed(2)
                : (limits.defaultUnitPriceCents / 100).toFixed(0);
            const unitStep = parameterType === "square_feet" ? 0.01 : 1;

            return (
              <div key={parameterType}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  {PRICING_PARAMETER_LABELS[parameterType]}
                </p>
                <div className="grid gap-2">
                  <input
                    name={fields.unit}
                    type="number"
                    min={0}
                    step={unitStep}
                    defaultValue={row ? (row.unitPriceCents / 100).toFixed(unitStep < 1 ? 2 : 0) : defaultUnitDollars}
                    placeholder={`Extra $/${parameterType === "square_feet" ? "sq ft" : "unit"}`}
                    className={input}
                  />
                  <input
                    name={fields.included}
                    type="number"
                    min={0}
                    max={limits.maxUnits}
                    defaultValue={row?.includedUnits ?? limits.defaultIncludedUnits}
                    placeholder="Included in base price"
                    className={input}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {!service?.isAddon && (
        <div className="sm:col-span-2 rounded-2xl bg-ink-50 p-4 ring-1 ring-ink-100">
          <p className="text-sm font-semibold text-ink-800">Recurring frequency discounts</p>
          <p className="mt-1 text-xs text-ink-500">
            Optional percent off when customers choose weekly, bi-weekly, or monthly.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {RECURRING_FREQUENCIES.map((freq) => {
              const row = frequencyDiscounts.find((d) => d.frequency === freq);
              const label =
                freq === "biweekly" ? "Bi-weekly" : freq.charAt(0).toUpperCase() + freq.slice(1);
              return (
                <div key={freq}>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-600">{label} % off</label>
                  <input
                    name={`freqDiscountPercent_${freq}`}
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={row?.percentOff ?? 0}
                    className={input}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
          Crew checklist (one item per line)
        </label>
        <textarea
          name="checklistItems"
          rows={5}
          defaultValue={checklistItems}
          className={input}
          placeholder={"Kitchen — counters & appliances\nBathrooms — full clean\nBedrooms — vacuum & dust"}
        />
        <p className="mt-1.5 text-xs text-ink-400">
          Copied to each new job for this service. Workers complete items on the crew job page.
        </p>
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-full bg-brand-400 px-5 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-300"
        >
          {service ? "Save changes" : "Create service"}
        </button>
      </div>
    </form>
  );
}

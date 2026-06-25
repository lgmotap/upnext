"use client";

import type { PricingParameterType } from "@/generated/prisma/client";
import {
  PRICING_PARAMETER_LABELS,
  PRICING_PARAMETER_LIMITS,
  formatParameterExtraPrice,
  type PricingParameterConfig,
} from "@/lib/pricing/parameters";

const input =
  "w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 focus:outline-none focus:ring-2 focus:ring-brand-400";

export function PricingParametersFields({
  configs,
  values,
  onChange,
}: {
  configs: PricingParameterConfig[];
  values: Record<PricingParameterType, number>;
  onChange: (parameterType: PricingParameterType, units: number) => void;
}) {
  if (configs.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {configs.map((config) => {
        const units = values[config.parameterType] ?? config.includedUnits;
        const step = PRICING_PARAMETER_LIMITS[config.parameterType].inputStep ?? 1;
        return (
          <div key={config.parameterType}>
            <input type="hidden" name={config.parameterType} value={units} />
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              {PRICING_PARAMETER_LABELS[config.parameterType]}
            </label>
            <input
              type="number"
              min={0}
              max={config.maxUnits}
              step={step}
              required
              value={units}
              onChange={(e) => {
                const next = Number(e.target.value);
                onChange(config.parameterType, Number.isFinite(next) ? next : 0);
              }}
              className={input}
            />
            <p className="mt-1 text-xs text-ink-500">{formatParameterExtraPrice(config)}</p>
          </div>
        );
      })}
    </div>
  );
}

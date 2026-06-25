import type { PricingParameterType } from "@/generated/prisma/client";

export const PRICING_PARAMETER_LABELS: Record<PricingParameterType, string> = {
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  half_bathrooms: "Half bathrooms",
  square_feet: "Square feet",
};

export const PRICING_PARAMETER_LIMITS: Record<
  PricingParameterType,
  { maxUnits: number; defaultUnitPriceCents: number; defaultIncludedUnits: number; inputStep?: number }
> = {
  bedrooms: { maxUnits: 10, defaultUnitPriceCents: 1500, defaultIncludedUnits: 2 },
  bathrooms: { maxUnits: 8, defaultUnitPriceCents: 2000, defaultIncludedUnits: 1 },
  half_bathrooms: { maxUnits: 6, defaultUnitPriceCents: 1000, defaultIncludedUnits: 0 },
  square_feet: { maxUnits: 10000, defaultUnitPriceCents: 2, defaultIncludedUnits: 0, inputStep: 100 },
};

/** Typical home size when sq ft is not included in base price. */
const DEFAULT_SQUARE_FEET = 1500;

export type PricingParameterConfig = {
  parameterType: PricingParameterType;
  unitPriceCents: number;
  includedUnits: number;
  maxUnits: number;
};

export type PricingParameterValues = Partial<Record<PricingParameterType, number>>;

export function formatParameterExtraPrice(config: PricingParameterConfig): string {
  if (config.parameterType === "square_feet") {
    const included =
      config.includedUnits > 0 ? `${config.includedUnits.toLocaleString()} sq ft included · ` : "";
    return `${included}+$${(config.unitPriceCents / 100).toFixed(2)} per sq ft over included`;
  }
  return `${config.includedUnits} included · +$${(config.unitPriceCents / 100).toFixed(0)} each extra`;
}

export function defaultUnitsForParameter(config: PricingParameterConfig): number {
  if (config.parameterType === "square_feet") {
    return config.includedUnits > 0 ? config.includedUnits : DEFAULT_SQUARE_FEET;
  }
  if (config.parameterType === "half_bathrooms") {
    return config.includedUnits > 0 ? Math.max(config.includedUnits, 1) : 0;
  }
  return Math.max(config.includedUnits, 1);
}

export function parameterSurchargeCents(config: PricingParameterConfig, units: number): number {
  const extra = Math.max(0, units - config.includedUnits);
  return extra * config.unitPriceCents;
}

export function calculatePricingParameterTotal(
  configs: PricingParameterConfig[],
  values: PricingParameterValues,
): number {
  return configs.reduce(
    (sum, config) => sum + parameterSurchargeCents(config, values[config.parameterType] ?? 0),
    0,
  );
}

export function defaultParameterValues(configs: PricingParameterConfig[]): PricingParameterValues {
  const values: PricingParameterValues = {};
  for (const config of configs) {
    values[config.parameterType] = defaultUnitsForParameter(config);
  }
  return values;
}

export function parseParameterInput(
  configs: PricingParameterConfig[],
  raw: Partial<Record<PricingParameterType, unknown>>,
): { ok: true; values: Record<PricingParameterType, number> } | { ok: false; error: string } {
  const values = {} as Record<PricingParameterType, number>;

  for (const config of configs) {
    const rawValue = raw[config.parameterType];
    const units = Number(rawValue);
    if (!Number.isInteger(units) || units < 0 || units > config.maxUnits) {
      return {
        ok: false,
        error: `Invalid ${PRICING_PARAMETER_LABELS[config.parameterType].toLowerCase()} count`,
      };
    }
    values[config.parameterType] = units;
  }

  return { ok: true, values };
}

export function bookingPriceCents(
  basePriceCents: number,
  addonTotalCents: number,
  configs: PricingParameterConfig[],
  values: PricingParameterValues,
): number {
  return basePriceCents + addonTotalCents + calculatePricingParameterTotal(configs, values);
}

import type { PricingParameterType } from "@/generated/prisma/client";

export const PRICING_PARAMETER_LABELS: Record<PricingParameterType, string> = {
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
};

export type PricingParameterConfig = {
  parameterType: PricingParameterType;
  unitPriceCents: number;
  includedUnits: number;
  maxUnits: number;
};

export type PricingParameterValues = Partial<Record<PricingParameterType, number>>;

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
    values[config.parameterType] = Math.max(config.includedUnits, 1);
  }
  return values;
}

export function parseParameterInput(
  configs: PricingParameterConfig[],
  raw: { bedrooms?: unknown; bathrooms?: unknown },
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

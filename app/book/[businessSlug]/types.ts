import type { PricingParameterConfig } from "@/lib/pricing/parameters";
import type { FrequencyDiscountConfig } from "@/lib/pricing/frequency-discount";

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  basePriceCents: number;
  currency: string;
  isAddon: boolean;
  iconKey: string | null;
  pricingParameters: PricingParameterConfig[];
  frequencyDiscounts: FrequencyDiscountConfig[];
};

export type PublicBusiness = {
  displayName: string;
  serviceArea: string | null;
  description: string | null;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  customerPortalEnabled?: boolean;
};

export type { BookableDay as SlotDay } from "@/lib/availability/calendar-ui";
export type SlotOption = { date: string; time: string; label: string };

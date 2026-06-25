import { serviceTypes } from "@/lib/config";
import type { ServiceIconKey } from "@/lib/onboarding/service-icons";

const INDUSTRY_ICON_BY_TYPE: Record<(typeof serviceTypes)[number], ServiceIconKey> = {
  "Residential Cleaning": "sparkles",
  "Commercial Cleaning": "building",
  "Carpet Cleaning": "carpet",
  "Lawn Care": "leaf",
  "Pressure Washing": "spray-can",
  Roofing: "roof",
  Handyman: "wrench",
  Painting: "paintbrush",
  "Pet Walking": "dog",
  "Car Wash": "car",
  "Other service business": "briefcase",
  "I'm still deciding": "clock",
};

export function industryIconKey(serviceType: string): ServiceIconKey {
  return INDUSTRY_ICON_BY_TYPE[serviceType as (typeof serviceTypes)[number]] ?? "briefcase";
}

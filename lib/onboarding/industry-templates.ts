import type { serviceTypes } from "@/lib/config";

export type ServiceType = (typeof serviceTypes)[number];

type IndustryTemplate = {
  serviceName: string;
  description: string;
  durationMinutes: number;
  basePriceCents: number;
};

const templates: Partial<Record<ServiceType, IndustryTemplate>> = {
  "Residential Cleaning": {
    serviceName: "Standard Home Cleaning",
    description: "Regular cleaning for homes and apartments.",
    durationMinutes: 120,
    basePriceCents: 15000,
  },
  "Commercial Cleaning": {
    serviceName: "Office Cleaning",
    description: "Recurring commercial cleaning visits.",
    durationMinutes: 180,
    basePriceCents: 25000,
  },
  "Carpet Cleaning": {
    serviceName: "Carpet Cleaning",
    description: "Room-by-room carpet refresh.",
    durationMinutes: 90,
    basePriceCents: 12000,
  },
  "Lawn Care": {
    serviceName: "Lawn Mowing",
    description: "Mow, edge, and blow off clippings.",
    durationMinutes: 60,
    basePriceCents: 6500,
  },
  "Pressure Washing": {
    serviceName: "Pressure Washing",
    description: "Driveway, siding, or patio wash.",
    durationMinutes: 120,
    basePriceCents: 18000,
  },
  Roofing: {
    serviceName: "Roof Inspection",
    description: "Visual roof inspection and report.",
    durationMinutes: 60,
    basePriceCents: 15000,
  },
  Handyman: {
    serviceName: "Handyman Visit",
    description: "General repairs and small projects.",
    durationMinutes: 120,
    basePriceCents: 14000,
  },
  Painting: {
    serviceName: "Interior Painting",
    description: "Single-room or accent wall painting.",
    durationMinutes: 240,
    basePriceCents: 35000,
  },
  "Pet Walking": {
    serviceName: "Dog Walk",
    description: "30-minute neighborhood walk.",
    durationMinutes: 30,
    basePriceCents: 2500,
  },
  "Car Wash": {
    serviceName: "Mobile Car Wash",
    description: "Exterior wash at the customer's location.",
    durationMinutes: 45,
    basePriceCents: 4500,
  },
};

export function industryServiceTemplate(businessType: string): IndustryTemplate {
  return (
    templates[businessType as ServiceType] ?? {
      serviceName: "Standard Service",
      description: "Your core offering — edit name and price anytime.",
      durationMinutes: 60,
      basePriceCents: 10000,
    }
  );
}

import { serviceTypes } from "@/lib/config";

type ServiceType = (typeof serviceTypes)[number];

export type CatalogService = {
  name: string;
  description: string;
  durationMinutes: number;
  basePriceCents: number;
  isAddon: boolean;
  pricingParameters?: Array<{
    parameterType: "bedrooms" | "bathrooms";
    unitPriceCents: number;
    includedUnits: number;
    maxUnits: number;
  }>;
};

/** Default bed/bath pricing for residential cleaning primary services. */
export const RESIDENTIAL_CLEANING_PRICING_PARAMS: NonNullable<CatalogService["pricingParameters"]> = [
  { parameterType: "bedrooms", unitPriceCents: 1500, includedUnits: 2, maxUnits: 10 },
  { parameterType: "bathrooms", unitPriceCents: 2000, includedUnits: 1, maxUnits: 8 },
];

export type IndustryCatalog = {
  label: string;
  primary: CatalogService[];
  addons: CatalogService[];
};

function svc(
  name: string,
  description: string,
  durationMinutes: number,
  basePriceCents: number,
  isAddon = false,
  pricingParameters?: CatalogService["pricingParameters"],
): CatalogService {
  return { name, description, durationMinutes, basePriceCents, isAddon, pricingParameters };
}

/** ConvertLabs-style catalogs: multiple bookable services + extras per vertical. */
const catalogs: Record<ServiceType, IndustryCatalog> = {
  "Residential Cleaning": {
    label: "Residential Cleaning",
    primary: [
      svc(
        "Standard Home Cleaning",
        "Regular maintenance clean for homes and apartments.",
        120,
        15000,
        false,
        RESIDENTIAL_CLEANING_PRICING_PARAMS,
      ),
      svc(
        "Deep Cleaning",
        "Detailed top-to-bottom clean — kitchens, baths, and high-touch areas.",
        180,
        22000,
        false,
        RESIDENTIAL_CLEANING_PRICING_PARAMS,
      ),
      svc(
        "Move In / Move Out Cleaning",
        "Empty-home clean for move-in or move-out turnovers.",
        240,
        30000,
        false,
        RESIDENTIAL_CLEANING_PRICING_PARAMS,
      ),
      svc(
        "Post-Construction Clean",
        "Dust and debris removal after renovations or new builds.",
        300,
        35000,
        false,
        RESIDENTIAL_CLEANING_PRICING_PARAMS,
      ),
    ],
    addons: [
      svc("Inside Empty Fridge", "Wipe and sanitize an empty refrigerator.", 30, 2000, true),
      svc("Inside Full Fridge", "Clean inside a stocked refrigerator.", 45, 6000, true),
      svc("Inside Oven", "Deep clean oven interior.", 30, 2000, true),
      svc("Inside Empty Cabinets", "Wipe inside empty kitchen cabinets.", 45, 3000, true),
      svc("Inside Full Cabinets", "Clean inside stocked cabinets.", 60, 6000, true),
      svc("Dishwasher Deep Clean", "Clean and deodorize dishwasher.", 20, 3000, true),
      svc("Second Kitchen", "Additional kitchen cleaning.", 60, 8000, true),
      svc("Interior Windows", "Interior glass on reachable windows.", 60, 5000, true),
      svc("Baseboards", "Wipe baseboards throughout the home.", 45, 4000, true),
    ],
  },
  "Commercial Cleaning": {
    label: "Commercial Cleaning",
    primary: [
      svc("Office Cleaning", "Nightly or weekly office maintenance.", 180, 25000),
      svc("Retail Store Cleaning", "Sales floor, restrooms, and break areas.", 150, 22000),
      svc("Post-Event Cleanup", "Reset venue after events or meetings.", 120, 20000),
    ],
    addons: [
      svc("Restroom Deep Clean", "Extra sanitization for restrooms.", 45, 4500, true),
      svc("Floor Buffing", "Buff hard floors for shine.", 60, 6000, true),
      svc("Trash & Recycling Haul", "Remove bags and reset bins.", 30, 2500, true),
      svc("Kitchenette Clean", "Break room appliances and counters.", 45, 3500, true),
    ],
  },
  "Carpet Cleaning": {
    label: "Carpet Cleaning",
    primary: [
      svc("Room Carpet Cleaning", "Steam clean for one carpeted room.", 60, 9900),
      svc("Whole-Home Carpet Cleaning", "All carpeted areas in a typical home.", 180, 24900),
      svc("Upholstery Cleaning", "Sofa or sectional steam clean.", 90, 12900),
    ],
    addons: [
      svc("Staircase", "Clean carpeted stairs.", 45, 7500, true),
      svc("Pet Odor Treatment", "Enzyme treatment for pet odors.", 30, 5000, true),
      svc("Scotchgard Protection", "Fabric protector application.", 30, 4500, true),
    ],
  },
  "Lawn Care": {
    label: "Lawn Care",
    primary: [
      svc("Lawn Mowing", "Mow, edge, and blow clippings.", 60, 6500),
      svc("Leaf Removal", "Bag and haul leaves from property.", 90, 12000),
      svc("Hedge Trimming", "Shape hedges and shrubs.", 75, 9500),
    ],
    addons: [
      svc("Edging", "Crisp edges along walks and beds.", 20, 2500, true),
      svc("Bag & Haul Clippings", "Remove clippings from site.", 20, 2000, true),
      svc("Weed Control Application", "Spot-treat weeds in lawn.", 30, 3500, true),
    ],
  },
  "Pressure Washing": {
    label: "Pressure Washing",
    primary: [
      svc("Driveway Wash", "Remove stains and mildew from driveway.", 90, 15000),
      svc("House Wash", "Soft-wash siding and trim.", 180, 28000),
      svc("Deck / Patio Wash", "Clean wood or concrete outdoor surfaces.", 120, 18000),
    ],
    addons: [
      svc("Walkway & Steps", "Pressure wash front walk and steps.", 45, 7500, true),
      svc("Fence Wash", "Clean wood or vinyl fencing.", 60, 9000, true),
      svc("Gutter Brightening", "Exterior gutter face cleaning.", 45, 6500, true),
    ],
  },
  Roofing: {
    label: "Roofing",
    primary: [
      svc("Roof Inspection", "Visual inspection with photo notes.", 60, 15000),
      svc("Roof Repair", "Minor shingle or leak repair visit.", 120, 25000),
      svc("Gutter Cleaning", "Clear debris from gutters and downspouts.", 90, 17500),
    ],
    addons: [
      svc("Moss Treatment", "Apply treatment to moss-prone areas.", 45, 8000, true),
      svc("Skylight Check", "Inspect and reseal skylight flashing.", 30, 5000, true),
    ],
  },
  Handyman: {
    label: "Handyman",
    primary: [
      svc("Handyman Visit (2 hr)", "General repairs and small projects.", 120, 14000),
      svc("TV Mounting", "Mount TV and conceal cables.", 90, 12500),
      svc("Furniture Assembly", "Assemble flat-pack furniture.", 120, 11000),
    ],
    addons: [
      svc("Extra Hour", "Additional on-site labor hour.", 60, 7500, true),
      svc("Hardware Run", "Pick up parts from local store.", 45, 5000, true),
      svc("Drywall Patch", "Small hole or crack repair.", 60, 8500, true),
    ],
  },
  Painting: {
    label: "Painting",
    primary: [
      svc("Interior Room Painting", "Walls and trim for one room.", 240, 35000),
      svc("Accent Wall", "Single feature wall.", 120, 18000),
      svc("Exterior Touch-Up", "Spot paint on siding or trim.", 180, 28000),
    ],
    addons: [
      svc("Ceiling Paint", "Paint one standard ceiling.", 90, 12000, true),
      svc("Cabinet Painting", "Paint kitchen cabinet faces.", 240, 45000, true),
      svc("Prep & Patch", "Surface prep and minor patching.", 60, 6500, true),
    ],
  },
  "Pet Walking": {
    label: "Pet Walking",
    primary: [
      svc("30-Minute Dog Walk", "Neighborhood walk with one dog.", 30, 2500),
      svc("60-Minute Dog Walk", "Longer walk or two-dog visit.", 60, 4000),
      svc("Pet Sitting Drop-In", "Feed, potty, and play visit.", 30, 3000),
    ],
    addons: [
      svc("Second Dog", "Additional dog on same visit.", 15, 1000, true),
      svc("Weekend Visit", "Saturday or Sunday premium.", 30, 1500, true),
      svc("Medication Admin", "Give prescribed medication.", 10, 1000, true),
    ],
  },
  "Car Wash": {
    label: "Car Wash",
    primary: [
      svc("Mobile Exterior Wash", "Hand wash exterior at customer location.", 45, 4500),
      svc("Interior + Exterior Detail", "Full inside-and-out detail.", 120, 15000),
      svc("Fleet Vehicle Wash", "Single commercial vehicle wash.", 60, 6500),
    ],
    addons: [
      svc("Pet Hair Removal", "Extra interior hair removal.", 30, 3500, true),
      svc("Engine Bay Clean", "Degrease and rinse engine bay.", 30, 4500, true),
      svc("Ceramic Spray Wax", "Paint protection application.", 20, 2500, true),
    ],
  },
  "Other service business": {
    label: "Home Services",
    primary: [
      svc("Standard Service Visit", "Your core on-site service.", 60, 10000),
      svc("Extended Service Visit", "Longer appointment block.", 120, 18000),
    ],
    addons: [
      svc("Rush / Same-Day", "Priority scheduling fee.", 0, 2500, true),
      svc("Materials / Supplies", "Consumables used on the job.", 0, 3500, true),
    ],
  },
  "I'm still deciding": {
    label: "Starter Pack",
    primary: [
      svc("Consultation Visit", "On-site assessment and quote.", 45, 7500),
      svc("Standard Service", "General service appointment.", 60, 10000),
    ],
    addons: [
      svc("Travel Fee", "Outside primary service area.", 0, 2500, true),
    ],
  },
};

const genericCatalog: IndustryCatalog = {
  label: "Home Services",
  primary: [svc("Standard Service", "Your core offering — edit anytime.", 60, 10000)],
  addons: [],
};

export function getIndustryCatalog(businessType: string): IndustryCatalog {
  if (serviceTypes.includes(businessType as ServiceType)) {
    return catalogs[businessType as ServiceType];
  }
  return genericCatalog;
}

export function listCatalogServices(businessType: string): CatalogService[] {
  const c = getIndustryCatalog(businessType);
  return [...c.primary, ...c.addons];
}

export function catalogStats(businessType: string) {
  const c = getIndustryCatalog(businessType);
  return {
    label: c.label,
    primaryCount: c.primary.length,
    addonCount: c.addons.length,
    totalCount: c.primary.length + c.addons.length,
  };
}

/** @deprecated Use getIndustryCatalog — kept for onboarding price hints */
export function industryServiceTemplate(businessType: string) {
  const primary = getIndustryCatalog(businessType).primary[0];
  return {
    serviceName: primary.name,
    description: primary.description,
    durationMinutes: primary.durationMinutes,
    basePriceCents: primary.basePriceCents,
  };
}

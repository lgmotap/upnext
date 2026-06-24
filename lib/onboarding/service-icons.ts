/** Lucide icon keys for catalog / booking service cards (ConvertLabs-style). */
export const SERVICE_ICON_KEYS = [
  "sparkles",
  "home",
  "truck",
  "hard-hat",
  "refrigerator",
  "flame",
  "archive",
  "box",
  "droplets",
  "window",
  "ruler",
  "plus",
  "building",
  "broom",
  "carpet",
  "sofa",
  "leaf",
  "scissors",
  "spray-can",
  "roof",
  "wrench",
  "paintbrush",
  "dog",
  "car",
  "briefcase",
  "clock",
  "hammer",
  "layers",
] as const;

export type ServiceIconKey = (typeof SERVICE_ICON_KEYS)[number];

export const DEFAULT_SERVICE_ICON: ServiceIconKey = "sparkles";
export const DEFAULT_ADDON_ICON: ServiceIconKey = "plus";

const ICON_BY_NAME: Record<string, ServiceIconKey> = {
  "Standard Home Cleaning": "sparkles",
  "Deep Cleaning": "spray-can",
  "Move In / Move Out Cleaning": "truck",
  "Post-Construction Clean": "hard-hat",
  "Inside Empty Fridge": "refrigerator",
  "Inside Full Fridge": "refrigerator",
  "Inside Oven": "flame",
  "Inside Empty Cabinets": "archive",
  "Inside Full Cabinets": "archive",
  "Dishwasher Deep Clean": "droplets",
  "Second Kitchen": "home",
  "Interior Windows": "window",
  Baseboards: "ruler",
  "Office Cleaning": "building",
  "Retail Store Cleaning": "building",
  "Post-Event Cleanup": "broom",
  "Restroom Deep Clean": "droplets",
  "Floor Buffing": "layers",
  "Trash & Recycling Haul": "box",
  "Kitchenette Clean": "home",
  "Room Carpet Cleaning": "carpet",
  "Whole-Home Carpet Cleaning": "carpet",
  "Upholstery Cleaning": "sofa",
  Staircase: "layers",
  "Pet Odor Treatment": "dog",
  "Scotchgard Protection": "spray-can",
  "Lawn Mowing": "scissors",
  "Leaf Removal": "leaf",
  "Hedge Trimming": "scissors",
  Edging: "ruler",
  "Bag & Haul Clippings": "box",
  "Weed Control Application": "leaf",
  "Driveway Wash": "spray-can",
  "House Wash": "home",
  "Deck / Patio Wash": "spray-can",
  "Walkway & Steps": "ruler",
  "Fence Wash": "ruler",
  "Gutter Brightening": "roof",
  "Roof Inspection": "roof",
  "Roof Repair": "hammer",
  "Gutter Cleaning": "droplets",
  "Moss Treatment": "leaf",
  "Skylight Check": "window",
  "Handyman Visit (2 hr)": "wrench",
  "TV Mounting": "wrench",
  "Furniture Assembly": "hammer",
  "Extra Hour": "clock",
  "Hardware Run": "truck",
  "Drywall Patch": "hammer",
  "Interior Room Painting": "paintbrush",
  "Accent Wall": "paintbrush",
  "Exterior Touch-Up": "paintbrush",
  "Ceiling Paint": "paintbrush",
  "Cabinet Painting": "paintbrush",
  "Prep & Patch": "hammer",
  "30-Minute Dog Walk": "dog",
  "60-Minute Dog Walk": "dog",
  "Pet Sitting Drop-In": "dog",
  "Second Dog": "dog",
  "Weekend Visit": "clock",
  "Medication Admin": "plus",
  "Mobile Exterior Wash": "car",
  "Interior + Exterior Detail": "car",
  "Fleet Vehicle Wash": "car",
  "Pet Hair Removal": "dog",
  "Engine Bay Clean": "wrench",
  "Ceramic Spray Wax": "sparkles",
  "Standard Service Visit": "briefcase",
  "Extended Service Visit": "clock",
  "Rush / Same-Day": "clock",
  "Materials / Supplies": "box",
  "Consultation Visit": "briefcase",
  "Standard Service": "briefcase",
  "Travel Fee": "truck",
};

export function resolveIconKeyForServiceName(name: string, isAddon = false): ServiceIconKey {
  const exact = ICON_BY_NAME[name];
  if (exact) return exact;

  const lower = name.toLowerCase();
  if (lower.includes("fridge") || lower.includes("refrigerator")) return "refrigerator";
  if (lower.includes("oven")) return "flame";
  if (lower.includes("window")) return "window";
  if (lower.includes("carpet")) return "carpet";
  if (lower.includes("lawn") || lower.includes("leaf") || lower.includes("moss")) return "leaf";
  if (lower.includes("dog") || lower.includes("pet")) return "dog";
  if (lower.includes("paint")) return "paintbrush";
  if (lower.includes("roof") || lower.includes("gutter")) return "roof";
  if (lower.includes("car") || lower.includes("vehicle") || lower.includes("fleet")) return "car";
  if (lower.includes("office") || lower.includes("commercial") || lower.includes("retail")) return "building";
  if (lower.includes("move")) return "truck";
  if (lower.includes("deep")) return "spray-can";
  if (lower.includes("clean")) return "sparkles";

  return isAddon ? DEFAULT_ADDON_ICON : DEFAULT_SERVICE_ICON;
}

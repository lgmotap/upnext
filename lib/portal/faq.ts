export type PortalFaqItem = {
  question: string;
  answer: string;
};

export const MAX_PORTAL_FAQ_ITEMS = 8;

const DEFAULT_CLEANING_BUSINESS_TYPE = "Residential Cleaning";

const CLEANING_FAQ_DEFAULTS: PortalFaqItem[] = [
  {
    question: "What's included in a standard cleaning?",
    answer:
      "We clean kitchens, bathrooms, living areas, and bedrooms — including surfaces, floors, and fixtures. Add-ons like inside ovens or fridges can be selected when you book.",
  },
  {
    question: "Do I need to be home during the service?",
    answer:
      "You don't have to be home if we have access. Many customers provide a door code or leave a key. We'll confirm access details when your booking is accepted.",
  },
  {
    question: "How do I reschedule or cancel?",
    answer:
      "Open Booking history and use Reschedule or Cancel on upcoming visits (subject to the notice policy shown in your portal).",
  },
];

export function isCleaningBusinessType(businessType: string | null | undefined): boolean {
  const bt = (businessType ?? DEFAULT_CLEANING_BUSINESS_TYPE).toLowerCase();
  return bt.includes("clean");
}

export function parsePortalFaqJson(raw: unknown): PortalFaqItem[] {
  if (!Array.isArray(raw)) return [];
  const items: PortalFaqItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const question = String((row as PortalFaqItem).question ?? "").trim();
    const answer = String((row as PortalFaqItem).answer ?? "").trim();
    if (!question || !answer) continue;
    items.push({ question, answer });
    if (items.length >= MAX_PORTAL_FAQ_ITEMS) break;
  }
  return items;
}

export function cleaningFaqDefaults(): PortalFaqItem[] {
  return CLEANING_FAQ_DEFAULTS.map((item) => ({ ...item }));
}

export function getPortalFaqFromProfile(profile: {
  portalFaqJson?: unknown;
  businessType?: string | null;
}): PortalFaqItem[] {
  const parsed = parsePortalFaqJson(profile.portalFaqJson);
  if (parsed.length > 0) return parsed;
  if (isCleaningBusinessType(profile.businessType)) return cleaningFaqDefaults();
  return [];
}

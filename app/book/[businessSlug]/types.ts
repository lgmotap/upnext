export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  basePriceCents: number;
  currency: string;
  isAddon: boolean;
};

export type PublicBusiness = {
  displayName: string;
  serviceArea: string | null;
  description: string | null;
};

export type { BookableDay as SlotDay } from "@/lib/availability/calendar-ui";
export type SlotOption = { date: string; time: string; label: string };

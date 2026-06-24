import {
  Archive,
  Box,
  Briefcase,
  Building2,
  Car,
  Clock,
  Dog,
  Droplets,
  Flame,
  Hammer,
  HardHat,
  Home,
  Layers,
  Leaf,
  Paintbrush,
  Plus,
  Refrigerator,
  Ruler,
  Scissors,
  Sofa,
  Sparkles,
  SprayCan,
  Truck,
  Wrench,
  AppWindow,
  type LucideIcon,
} from "lucide-react";
import {
  DEFAULT_ADDON_ICON,
  DEFAULT_SERVICE_ICON,
  type ServiceIconKey,
} from "@/lib/onboarding/service-icons";

const ICON_MAP: Record<ServiceIconKey, LucideIcon> = {
  sparkles: Sparkles,
  home: Home,
  truck: Truck,
  "hard-hat": HardHat,
  refrigerator: Refrigerator,
  flame: Flame,
  archive: Archive,
  box: Box,
  droplets: Droplets,
  window: AppWindow,
  ruler: Ruler,
  plus: Plus,
  building: Building2,
  broom: Sparkles,
  carpet: Layers,
  sofa: Sofa,
  leaf: Leaf,
  scissors: Scissors,
  "spray-can": SprayCan,
  roof: Home,
  wrench: Wrench,
  paintbrush: Paintbrush,
  dog: Dog,
  car: Car,
  briefcase: Briefcase,
  clock: Clock,
  hammer: Hammer,
  layers: Layers,
};

export function ServiceIcon({
  iconKey,
  isAddon = false,
  className,
}: {
  iconKey?: string | null;
  isAddon?: boolean;
  className?: string;
}) {
  const fallback = isAddon ? DEFAULT_ADDON_ICON : DEFAULT_SERVICE_ICON;
  const key = (iconKey as ServiceIconKey | undefined) ?? fallback;
  const Icon = ICON_MAP[key] ?? Sparkles;
  return <Icon className={className} aria-hidden />;
}

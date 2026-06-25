export const SERVICE_AREA_SCOPES = ["city_state", "metro", "custom"] as const;
export type ServiceAreaScope = (typeof SERVICE_AREA_SCOPES)[number];

export const SERVICE_AREA_SCOPE_LABELS: Record<ServiceAreaScope, string> = {
  city_state: "City & state",
  metro: "Metro / greater area",
  custom: "Custom label",
};

export function formatServiceAreaDisplay(
  city: string,
  region: string,
  scope: ServiceAreaScope,
  custom?: string,
): string {
  const c = city.trim();
  const r = region.trim();
  if (scope === "custom") {
    return (custom ?? "").trim();
  }
  if (!c && !r) return "";
  if (!c) return r;
  if (!r) return c;
  if (scope === "metro") return `Greater ${c}, ${r}`;
  return `${c}, ${r}`;
}

export function inferServiceAreaScope(
  display: string | null | undefined,
  city: string,
  region: string,
): ServiceAreaScope {
  const c = city.trim();
  const r = region.trim();
  if (!display?.trim()) return c && r ? "metro" : "city_state";
  const normalized = display.trim();
  if (c && r) {
    if (normalized === formatServiceAreaDisplay(c, r, "metro")) return "metro";
    if (normalized === formatServiceAreaDisplay(c, r, "city_state")) return "city_state";
  }
  return "custom";
}

export function inferServiceAreaCustom(
  display: string | null | undefined,
  city: string,
  region: string,
  scope: ServiceAreaScope,
): string {
  if (scope !== "custom") return "";
  return display?.trim() ?? "";
}

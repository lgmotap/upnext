export function formatJobServicesLine(
  serviceName: string,
  addonNames: string[] = [],
): string {
  const extras = addonNames.filter(Boolean);
  if (extras.length === 0) return serviceName;
  return [serviceName, ...extras].join(" — ");
}

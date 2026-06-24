/** Portal is on by default; treat missing/legacy rows as enabled. */
export function isCustomerPortalEnabled(profile: { customerPortalEnabled?: boolean | null } | null | undefined): boolean {
  return profile != null && profile.customerPortalEnabled !== false;
}

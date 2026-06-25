/** Derive 1–2 letter initials from display name or email. */
export function userInitials(name: string | null | undefined, email: string): string {
  const fromName = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  if (fromName) return fromName;
  const local = email.split("@")[0] ?? "";
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return local[0]?.toUpperCase() ?? "U";
}

/** Supabase / OAuth avatar fields on user_metadata. */
export function avatarUrlFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (!metadata) return null;
  const url = metadata.avatar_url ?? metadata.picture;
  return typeof url === "string" && url.length > 0 ? url : null;
}

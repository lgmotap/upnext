export const BUSINESS_LOGOS_BUCKET = "business-logos";
export const MAX_BUSINESS_LOGO_BYTES = 2 * 1024 * 1024;

export const ALLOWED_BUSINESS_LOGO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type BusinessLogoMimeType = (typeof ALLOWED_BUSINESS_LOGO_MIME_TYPES)[number];

export function extensionForBusinessLogoMime(mimeType: BusinessLogoMimeType): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

export function buildBusinessLogoStoragePath(
  organizationId: string,
  mimeType: BusinessLogoMimeType,
): string {
  return `${organizationId}/logo.${extensionForBusinessLogoMime(mimeType)}`;
}

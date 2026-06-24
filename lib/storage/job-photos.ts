export const JOB_PHOTOS_BUCKET = "job-photos";
export const MAX_JOB_PHOTOS = 5;
export const MAX_JOB_PHOTO_BYTES = 5 * 1024 * 1024;

export const ALLOWED_JOB_PHOTO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type JobPhotoMimeType = (typeof ALLOWED_JOB_PHOTO_MIME_TYPES)[number];

export function extensionForMimeType(mimeType: JobPhotoMimeType): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
  }
}

export function buildJobPhotoStoragePath(
  organizationId: string,
  jobId: string,
  photoId: string,
  mimeType: JobPhotoMimeType,
): string {
  return `${organizationId}/${jobId}/${photoId}.${extensionForMimeType(mimeType)}`;
}

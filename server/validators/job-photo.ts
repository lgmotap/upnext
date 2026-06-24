import { z } from "zod";
import { ALLOWED_JOB_PHOTO_MIME_TYPES } from "@/lib/storage/job-photos";

export const jobPhotoTypeSchema = z.enum(["before", "after", "proof", "issue", "other"]);

export const uploadJobPhotoSchema = z.object({
  jobId: z.string().min(1),
  type: jobPhotoTypeSchema.default("proof"),
  caption: z.string().max(200).optional(),
});

export function isAllowedJobPhotoMimeType(value: string): value is (typeof ALLOWED_JOB_PHOTO_MIME_TYPES)[number] {
  return (ALLOWED_JOB_PHOTO_MIME_TYPES as readonly string[]).includes(value);
}

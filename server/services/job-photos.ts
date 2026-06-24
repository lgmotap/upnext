import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db/prisma";
import {
  ALLOWED_JOB_PHOTO_MIME_TYPES,
  JOB_PHOTOS_BUCKET,
  MAX_JOB_PHOTO_BYTES,
  MAX_JOB_PHOTOS,
  buildJobPhotoStoragePath,
  type JobPhotoMimeType,
} from "@/lib/storage/job-photos";
import type { JobPhotoType } from "@/generated/prisma/client";
import { listJobPhotosForJob } from "@/server/repositories/job-photos";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type JobPhotoWithUrl = {
  id: string;
  type: JobPhotoType;
  caption: string | null;
  createdAt: Date;
  url: string;
  uploadedByName: string | null;
};

async function ensureJobPhotosBucket() {
  const supabase = createAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets?.some((bucket) => bucket.name === JOB_PHOTOS_BUCKET)) return;

  const { error } = await supabase.storage.createBucket(JOB_PHOTOS_BUCKET, {
    public: false,
    fileSizeLimit: MAX_JOB_PHOTO_BYTES,
    allowedMimeTypes: [...ALLOWED_JOB_PHOTO_MIME_TYPES],
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

export async function getJobPhotosWithUrls(
  organizationId: string,
  jobId: string,
): Promise<JobPhotoWithUrl[]> {
  const photos = await listJobPhotosForJob(organizationId, jobId);
  if (photos.length === 0) return [];

  const supabase = createAdminClient();
  const withUrls = await Promise.all(
    photos.map(async (photo) => {
      const { data, error } = await supabase.storage
        .from(JOB_PHOTOS_BUCKET)
        .createSignedUrl(photo.storagePath, SIGNED_URL_TTL_SECONDS);
      if (error) {
        console.error("job photo signed url error", photo.id, error.message);
      }
      return {
        id: photo.id,
        type: photo.type,
        caption: photo.caption,
        createdAt: photo.createdAt,
        url: data?.signedUrl ?? "",
        uploadedByName: photo.uploadedBy.user.name ?? photo.uploadedBy.user.email,
      };
    }),
  );

  return withUrls.filter((photo) => photo.url.length > 0);
}

export async function uploadJobPhoto(
  organizationId: string,
  jobId: string,
  membershipId: string,
  file: File,
  type: JobPhotoType,
  caption?: string,
) {
  const job = await prisma.job.findFirst({ where: { id: jobId, organizationId } });
  if (!job) return { ok: false as const, error: "Job not found" };

  const count = await prisma.jobPhoto.count({ where: { jobId } });
  if (count >= MAX_JOB_PHOTOS) {
    return { ok: false as const, error: `Maximum ${MAX_JOB_PHOTOS} photos per job` };
  }

  if (!ALLOWED_JOB_PHOTO_MIME_TYPES.includes(file.type as JobPhotoMimeType)) {
    return { ok: false as const, error: "Only JPEG, PNG, or WebP images are allowed" };
  }

  if (file.size > MAX_JOB_PHOTO_BYTES) {
    return { ok: false as const, error: "Image must be 5 MB or smaller" };
  }

  await ensureJobPhotosBucket();

  const photoId = randomUUID();
  const mimeType = file.type as JobPhotoMimeType;
  const storagePath = buildJobPhotoStoragePath(organizationId, jobId, photoId, mimeType);
  const bytes = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(JOB_PHOTOS_BUCKET)
    .upload(storagePath, bytes, { contentType: mimeType, upsert: false });

  if (uploadError) {
    console.error("job photo upload error", uploadError.message);
    return { ok: false as const, error: "Upload failed — try again" };
  }

  const photo = await prisma.jobPhoto.create({
    data: {
      id: photoId,
      jobId,
      uploadedByMembershipId: membershipId,
      storagePath,
      mimeType,
      type,
      caption: caption?.trim() || null,
    },
  });

  return { ok: true as const, photoId: photo.id };
}

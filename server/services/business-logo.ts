import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db/prisma";
import {
  ALLOWED_BUSINESS_LOGO_MIME_TYPES,
  buildBusinessLogoStoragePath,
  BUSINESS_LOGOS_BUCKET,
  MAX_BUSINESS_LOGO_BYTES,
  type BusinessLogoMimeType,
} from "@/lib/storage/business-logo";

async function ensureBusinessLogosBucket() {
  const supabase = createAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets?.some((bucket) => bucket.name === BUSINESS_LOGOS_BUCKET)) return;

  const { error } = await supabase.storage.createBucket(BUSINESS_LOGOS_BUCKET, {
    public: true,
    fileSizeLimit: MAX_BUSINESS_LOGO_BYTES,
    allowedMimeTypes: [...ALLOWED_BUSINESS_LOGO_MIME_TYPES],
  });
  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

function publicLogoUrl(storagePath: string): string {
  const supabase = createAdminClient();
  const { data } = supabase.storage.from(BUSINESS_LOGOS_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function removeStoredLogo(organizationId: string) {
  const supabase = createAdminClient();
  const prefix = `${organizationId}/`;
  const { data: files, error: listError } = await supabase.storage
    .from(BUSINESS_LOGOS_BUCKET)
    .list(organizationId);
  if (listError) {
    console.error("business logo list error", listError.message);
    return;
  }
  if (!files?.length) return;
  const paths = files.map((f) => `${prefix}${f.name}`);
  const { error: removeError } = await supabase.storage.from(BUSINESS_LOGOS_BUCKET).remove(paths);
  if (removeError) {
    console.error("business logo remove error", removeError.message);
  }
}

export async function uploadBusinessLogo(organizationId: string, file: File) {
  if (!ALLOWED_BUSINESS_LOGO_MIME_TYPES.includes(file.type as BusinessLogoMimeType)) {
    return { ok: false as const, error: "Only JPEG, PNG, or WebP images are allowed" };
  }
  if (file.size > MAX_BUSINESS_LOGO_BYTES) {
    return { ok: false as const, error: "Logo must be 2 MB or smaller" };
  }

  await ensureBusinessLogosBucket();
  await removeStoredLogo(organizationId);

  const mimeType = file.type as BusinessLogoMimeType;
  const storagePath = buildBusinessLogoStoragePath(organizationId, mimeType);
  const bytes = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage
    .from(BUSINESS_LOGOS_BUCKET)
    .upload(storagePath, bytes, { contentType: mimeType, upsert: true });

  if (uploadError) {
    console.error("business logo upload error", uploadError.message);
    return { ok: false as const, error: "Upload failed — try again" };
  }

  const logoUrl = publicLogoUrl(storagePath);
  await prisma.businessProfile.update({
    where: { organizationId },
    data: { logoUrl },
  });

  return { ok: true as const, logoUrl };
}

export async function removeBusinessLogo(organizationId: string) {
  await removeStoredLogo(organizationId);
  await prisma.businessProfile.update({
    where: { organizationId },
    data: { logoUrl: null },
  });
  return { ok: true as const };
}

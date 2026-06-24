-- Sprint 06: job photos (metadata in Postgres; files in Supabase Storage bucket job-photos)

CREATE TYPE "JobPhotoType" AS ENUM ('before', 'after', 'proof', 'issue', 'other');

CREATE TABLE "JobPhoto" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "uploadedByMembershipId" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "type" "JobPhotoType" NOT NULL DEFAULT 'proof',
    "caption" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobPhoto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "JobPhoto_jobId_idx" ON "JobPhoto"("jobId");

ALTER TABLE "JobPhoto" ADD CONSTRAINT "JobPhoto_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobPhoto" ADD CONSTRAINT "JobPhoto_uploadedByMembershipId_fkey"
  FOREIGN KEY ("uploadedByMembershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JobPhoto" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "JobPhoto" FROM anon, authenticated;

-- Private bucket for crew uploads (server uses service role; clients get signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-photos',
  'job-photos',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

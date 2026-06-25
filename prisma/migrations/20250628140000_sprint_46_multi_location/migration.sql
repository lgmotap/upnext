-- Sprint 46: multi-location v1

CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "addressLine1" TEXT,
  "addressLine2" TEXT,
  "city" TEXT,
  "region" TEXT,
  "postalCode" TEXT,
  "country" TEXT NOT NULL DEFAULT 'US',
  "phone" TEXT,
  "timezone" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Location_organizationId_idx" ON "Location"("organizationId");
CREATE INDEX "Location_organizationId_isActive_idx" ON "Location"("organizationId", "isActive");

ALTER TABLE "Location"
  ADD CONSTRAINT "Location_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BookingRequest" ADD COLUMN "locationId" TEXT;
ALTER TABLE "Job" ADD COLUMN "locationId" TEXT;

CREATE INDEX "BookingRequest_organizationId_locationId_idx" ON "BookingRequest"("organizationId", "locationId");
CREATE INDEX "Job_organizationId_locationId_idx" ON "Job"("organizationId", "locationId");

ALTER TABLE "BookingRequest"
  ADD CONSTRAINT "BookingRequest_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Job"
  ADD CONSTRAINT "Job_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill default location per org from BusinessProfile
INSERT INTO "Location" (
  "id",
  "organizationId",
  "name",
  "isDefault",
  "isActive",
  "addressLine1",
  "addressLine2",
  "city",
  "region",
  "postalCode",
  "country",
  "phone",
  "sortOrder",
  "createdAt",
  "updatedAt"
)
SELECT
  'loc_' || substr(md5(bp."organizationId" || bp."id"), 1, 22),
  bp."organizationId",
  COALESCE(NULLIF(trim(bp."displayName"), ''), 'Main location'),
  true,
  true,
  bp."addressLine1",
  bp."addressLine2",
  bp."city",
  bp."region",
  bp."postalCode",
  COALESCE(bp."country", 'US'),
  bp."phone",
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "BusinessProfile" bp
WHERE NOT EXISTS (
  SELECT 1 FROM "Location" l WHERE l."organizationId" = bp."organizationId"
);

UPDATE "BookingRequest" br
SET "locationId" = l."id"
FROM "Location" l
WHERE l."organizationId" = br."organizationId"
  AND l."isDefault" = true
  AND br."locationId" IS NULL;

UPDATE "Job" j
SET "locationId" = l."id"
FROM "Location" l
WHERE l."organizationId" = j."organizationId"
  AND l."isDefault" = true
  AND j."locationId" IS NULL;

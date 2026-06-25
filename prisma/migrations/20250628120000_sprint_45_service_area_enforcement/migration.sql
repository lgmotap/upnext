-- Sprint 45: optional service-area enforcement (zip list / radius)

CREATE TYPE "ServiceAreaEnforcementMode" AS ENUM ('off', 'zip_list', 'radius');

ALTER TABLE "BusinessProfile"
  ADD COLUMN "serviceAreaEnforcementMode" "ServiceAreaEnforcementMode" NOT NULL DEFAULT 'off',
  ADD COLUMN "serviceAreaRadiusMiles" INTEGER,
  ADD COLUMN "serviceAreaZipCodesJson" JSONB,
  ADD COLUMN "addressLatitude" DOUBLE PRECISION,
  ADD COLUMN "addressLongitude" DOUBLE PRECISION;

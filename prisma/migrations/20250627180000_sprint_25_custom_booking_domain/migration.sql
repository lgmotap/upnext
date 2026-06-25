-- Sprint 25: custom booking domain host mapping
ALTER TABLE "BusinessProfile" ADD COLUMN IF NOT EXISTS "customBookingHost" TEXT;
ALTER TABLE "BusinessProfile" ADD COLUMN IF NOT EXISTS "customBookingVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "BusinessProfile_customBookingHost_key" ON "BusinessProfile"("customBookingHost");

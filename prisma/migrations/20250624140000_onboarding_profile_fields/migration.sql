-- Onboarding profile: industry, business address, completion timestamp
ALTER TABLE "BusinessProfile"
  ADD COLUMN "businessType" TEXT,
  ADD COLUMN "teamSize" TEXT,
  ADD COLUMN "addressLine1" TEXT,
  ADD COLUMN "addressLine2" TEXT,
  ADD COLUMN "city" TEXT,
  ADD COLUMN "region" TEXT,
  ADD COLUMN "postalCode" TEXT,
  ADD COLUMN "country" TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Existing workspaces created before this migration are treated as onboarded.
UPDATE "BusinessProfile"
SET "onboardingCompletedAt" = NOW()
WHERE "onboardingCompletedAt" IS NULL;

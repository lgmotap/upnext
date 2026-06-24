-- Sprint 02: services, availability, booking window settings
ALTER TABLE "BusinessProfile"
  ADD COLUMN IF NOT EXISTS "minNoticeHours" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "maxBookingDaysAhead" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 30;

CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL,
    "basePriceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlackoutDate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BlackoutDate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Service_organizationId_idx" ON "Service"("organizationId");
CREATE INDEX "Service_organizationId_isActive_isPublic_idx" ON "Service"("organizationId", "isActive", "isPublic");
CREATE UNIQUE INDEX "AvailabilityRule_organizationId_dayOfWeek_key" ON "AvailabilityRule"("organizationId", "dayOfWeek");
CREATE INDEX "AvailabilityRule_organizationId_idx" ON "AvailabilityRule"("organizationId");
CREATE INDEX "BlackoutDate_organizationId_idx" ON "BlackoutDate"("organizationId");
CREATE INDEX "BlackoutDate_organizationId_startsAt_idx" ON "BlackoutDate"("organizationId", "startsAt");

ALTER TABLE "Service" ADD CONSTRAINT "Service_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlackoutDate" ADD CONSTRAINT "BlackoutDate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

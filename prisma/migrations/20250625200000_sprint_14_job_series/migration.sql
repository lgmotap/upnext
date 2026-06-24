-- Sprint 14: recurring job series

CREATE TYPE "JobSeriesStatus" AS ENUM ('active', 'paused', 'cancelled');

CREATE TABLE "JobSeries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "customerAddressId" TEXT,
    "frequency" "BookingFrequency" NOT NULL,
    "anchorJobId" TEXT,
    "preferredTimeHm" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "nextOccurrenceAt" TIMESTAMP(3) NOT NULL,
    "assignMembershipId" TEXT,
    "status" "JobSeriesStatus" NOT NULL DEFAULT 'active',
    "customerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobSeries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobSeries_anchorJobId_key" ON "JobSeries"("anchorJobId");
CREATE INDEX "JobSeries_organizationId_status_nextOccurrenceAt_idx" ON "JobSeries"("organizationId", "status", "nextOccurrenceAt");

ALTER TABLE "JobSeries" ADD CONSTRAINT "JobSeries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobSeries" ADD CONSTRAINT "JobSeries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobSeries" ADD CONSTRAINT "JobSeries_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobSeries" ADD CONSTRAINT "JobSeries_anchorJobId_fkey" FOREIGN KEY ("anchorJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Job" ADD COLUMN "jobSeriesId" TEXT;
ALTER TABLE "Job" ADD CONSTRAINT "Job_jobSeriesId_fkey" FOREIGN KEY ("jobSeriesId") REFERENCES "JobSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "NotificationTemplate" ADD VALUE IF NOT EXISTS 'recurring_job_scheduled';

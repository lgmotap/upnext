-- Sprint 22: scheduling depth (buffers, carry-over, frequency discounts)

ALTER TABLE "BusinessProfile"
  ADD COLUMN "bufferMinutesBetweenJobs" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "providerCarryOverMinutes" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ServiceFrequencyDiscount" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "frequency" "BookingFrequency" NOT NULL,
  "percentOff" INTEGER NOT NULL DEFAULT 0,
  "amountOffCents" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ServiceFrequencyDiscount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServiceFrequencyDiscount_serviceId_frequency_key" ON "ServiceFrequencyDiscount"("serviceId", "frequency");
CREATE INDEX "ServiceFrequencyDiscount_serviceId_idx" ON "ServiceFrequencyDiscount"("serviceId");

ALTER TABLE "ServiceFrequencyDiscount" ADD CONSTRAINT "ServiceFrequencyDiscount_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

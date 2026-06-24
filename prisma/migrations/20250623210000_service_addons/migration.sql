-- AlterTable
ALTER TABLE "Service" ADD COLUMN "isAddon" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BookingRequestAddon" (
    "id" TEXT NOT NULL,
    "bookingRequestId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingRequestAddon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingRequestAddon_bookingRequestId_idx" ON "BookingRequestAddon"("bookingRequestId");

-- AddForeignKey
ALTER TABLE "BookingRequestAddon" ADD CONSTRAINT "BookingRequestAddon_bookingRequestId_fkey" FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BookingRequestAddon" ADD CONSTRAINT "BookingRequestAddon_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BookingRequestAddon" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "BookingRequestAddon" FROM anon, authenticated;

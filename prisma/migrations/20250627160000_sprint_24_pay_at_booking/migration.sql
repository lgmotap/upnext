-- Sprint 24: optional pay-at-booking
ALTER TABLE "BusinessProfile" ADD COLUMN IF NOT EXISTS "payAtBookingEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "BusinessProfile" ADD COLUMN IF NOT EXISTS "requirePaymentAtBooking" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "PaymentRecord" ALTER COLUMN "jobId" DROP NOT NULL;

ALTER TABLE "PaymentRecord" ADD COLUMN IF NOT EXISTS "bookingRequestId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "PaymentRecord_bookingRequestId_key" ON "PaymentRecord"("bookingRequestId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PaymentRecord_bookingRequestId_fkey'
  ) THEN
    ALTER TABLE "PaymentRecord"
      ADD CONSTRAINT "PaymentRecord_bookingRequestId_fkey"
      FOREIGN KEY ("bookingRequestId") REFERENCES "BookingRequest"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

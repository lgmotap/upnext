-- Sprint 07: persist notification toggles on BusinessProfile

ALTER TABLE "BusinessProfile"
  ADD COLUMN "notifyOwnerNewBooking" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyCustomerBookingConfirmation" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyCustomerReminder24h" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyCustomerReminder2h" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notifyCustomerJobCompleted" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyCustomerPaymentRequest" BOOLEAN NOT NULL DEFAULT true;

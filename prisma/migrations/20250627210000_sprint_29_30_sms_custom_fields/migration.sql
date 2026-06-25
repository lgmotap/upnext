-- Sprint 29 SMS + Sprint 30 custom booking fields
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'sms';

ALTER TABLE "BusinessProfile"
  ADD COLUMN "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "smsFromNumber" TEXT,
  ADD COLUMN "notifyCustomerSmsReminder24h" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notifyCustomerSmsOnTheWay" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notifyCustomerSmsRunningLate" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notifyWorkerSmsJobAssigned" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "BookingRequest"
  ADD COLUMN "customFieldsJson" JSONB;

CREATE TYPE "BookingFormFieldType" AS ENUM ('text', 'textarea', 'select', 'checkbox');

CREATE TABLE "BookingFormField" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "fieldType" "BookingFormFieldType" NOT NULL DEFAULT 'text',
  "optionsJson" JSONB,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BookingFormField_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BookingFormField_organizationId_key_key" ON "BookingFormField"("organizationId", "key");
CREATE INDEX "BookingFormField_organizationId_active_sortOrder_idx" ON "BookingFormField"("organizationId", "active", "sortOrder");

ALTER TABLE "BookingFormField" ADD CONSTRAINT "BookingFormField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

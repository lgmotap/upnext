-- Sprint 06: NotificationLog for email delivery audit trail

CREATE TYPE "NotificationRecipientType" AS ENUM ('customer', 'owner', 'worker');
CREATE TYPE "NotificationChannel" AS ENUM ('email');
CREATE TYPE "NotificationStatus" AS ENUM ('sent', 'failed', 'skipped');
CREATE TYPE "NotificationTemplate" AS ENUM (
  'booking_confirmation',
  'new_booking_request',
  'booking_accepted',
  'booking_declined',
  'booking_reminder_24h',
  'booking_reminder_2h',
  'crew_job_assigned',
  'job_completed',
  'payment_request'
);

CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "recipientType" "NotificationRecipientType" NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL DEFAULT 'email',
  "template" "NotificationTemplate" NOT NULL,
  "status" "NotificationStatus" NOT NULL,
  "relatedType" TEXT NOT NULL,
  "relatedId" TEXT NOT NULL,
  "resendEmailId" TEXT,
  "error" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NotificationLog_organizationId_idx" ON "NotificationLog"("organizationId");
CREATE INDEX "NotificationLog_organizationId_template_relatedId_idx" ON "NotificationLog"("organizationId", "template", "relatedId");
CREATE INDEX "NotificationLog_relatedType_relatedId_idx" ON "NotificationLog"("relatedType", "relatedId");

ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

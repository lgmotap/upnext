-- Sprint 10: customer portal magic links + settings toggle

ALTER TABLE "BusinessProfile" ADD COLUMN IF NOT EXISTS "customerPortalEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "portalLastLoginAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "CustomerPortalToken" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerPortalToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerPortalToken_token_key" ON "CustomerPortalToken"("token");
CREATE INDEX IF NOT EXISTS "CustomerPortalToken_organizationId_customerId_idx" ON "CustomerPortalToken"("organizationId", "customerId");
CREATE INDEX IF NOT EXISTS "CustomerPortalToken_expiresAt_idx" ON "CustomerPortalToken"("expiresAt");

DO $$ BEGIN
  ALTER TABLE "CustomerPortalToken" ADD CONSTRAINT "CustomerPortalToken_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CustomerPortalToken" ADD CONSTRAINT "CustomerPortalToken_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "NotificationTemplate" ADD VALUE IF NOT EXISTS 'customer_portal_link';
ALTER TYPE "NotificationTemplate" ADD VALUE IF NOT EXISTS 'booking_cancelled_by_customer';

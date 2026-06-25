-- Sprint 26: portal password login + FAQ
ALTER TABLE "BusinessProfile"
  ADD COLUMN "portalPasswordLoginEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "portalFaqJson" JSONB;

ALTER TABLE "Customer"
  ADD COLUMN "portalUserId" TEXT;

CREATE UNIQUE INDEX "Customer_portalUserId_key" ON "Customer"("portalUserId");

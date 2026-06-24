-- Sprint 16: Stripe customer id on Customer for portal saved cards

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;

CREATE INDEX IF NOT EXISTS "Customer_stripeCustomerId_idx" ON "Customer"("stripeCustomerId");

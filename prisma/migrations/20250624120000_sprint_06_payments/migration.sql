-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('not_requested', 'pending', 'paid', 'overdue', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('manual', 'stripe');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "stripeConnectAccountId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "stripeConnectChargesEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'not_requested',
    "provider" "PaymentProvider" NOT NULL DEFAULT 'manual',
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "paymentUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_jobId_key" ON "PaymentRecord"("jobId");
CREATE UNIQUE INDEX "PaymentRecord_stripeCheckoutSessionId_key" ON "PaymentRecord"("stripeCheckoutSessionId");
CREATE INDEX "PaymentRecord_organizationId_idx" ON "PaymentRecord"("organizationId");
CREATE INDEX "PaymentRecord_organizationId_status_idx" ON "PaymentRecord"("organizationId", "status");
CREATE INDEX "PaymentRecord_customerId_idx" ON "PaymentRecord"("customerId");
CREATE INDEX "StripeWebhookEvent_organizationId_idx" ON "StripeWebhookEvent"("organizationId");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StripeWebhookEvent" ADD CONSTRAINT "StripeWebhookEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS
ALTER TABLE "PaymentRecord" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "PaymentRecord" FROM anon, authenticated;
ALTER TABLE "StripeWebhookEvent" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "StripeWebhookEvent" FROM anon, authenticated;

-- Backfill payment rows for existing jobs
INSERT INTO "PaymentRecord" ("id", "organizationId", "jobId", "customerId", "amountCents", "currency", "status", "provider", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    j."organizationId",
    j."id",
    j."customerId",
    j."priceCents",
    j."currency",
    'not_requested'::"PaymentStatus",
    'manual'::"PaymentProvider",
    NOW(),
    NOW()
FROM "Job" j
WHERE NOT EXISTS (SELECT 1 FROM "PaymentRecord" p WHERE p."jobId" = j."id");

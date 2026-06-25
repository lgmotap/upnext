-- CreateTable
CREATE TABLE "WaitlistLead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT,
    "businessSize" TEXT,
    "currentTool" TEXT,
    "source" TEXT,
    "thankYouSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistLead_email_key" ON "WaitlistLead"("email");

-- CreateIndex
CREATE INDEX "WaitlistLead_createdAt_idx" ON "WaitlistLead"("createdAt");

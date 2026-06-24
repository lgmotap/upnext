-- Sprint 18: per-worker weekly availability
CREATE TABLE "MembershipAvailabilityRule" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipAvailabilityRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipAvailabilityRule_membershipId_dayOfWeek_key" ON "MembershipAvailabilityRule"("membershipId", "dayOfWeek");
CREATE INDEX "MembershipAvailabilityRule_membershipId_idx" ON "MembershipAvailabilityRule"("membershipId");

ALTER TABLE "MembershipAvailabilityRule" ADD CONSTRAINT "MembershipAvailabilityRule_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

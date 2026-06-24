-- Sprint 06: team invites + notification template

ALTER TYPE "NotificationTemplate" ADD VALUE IF NOT EXISTS 'team_invite';

CREATE TABLE "TeamInvite" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'worker',
    "token" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TeamInvite_token_key" ON "TeamInvite"("token");
CREATE INDEX "TeamInvite_organizationId_idx" ON "TeamInvite"("organizationId");
CREATE INDEX "TeamInvite_email_idx" ON "TeamInvite"("email");
CREATE INDEX "TeamInvite_organizationId_email_idx" ON "TeamInvite"("organizationId", "email");

ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeamInvite" ADD CONSTRAINT "TeamInvite_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TeamInvite" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "TeamInvite" FROM anon, authenticated;

/**
 * Smoke: team invite create + accept (no email).
 * Run: npx tsx scripts/smoke-team-invite.ts
 */
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const { prisma } = await import("../lib/db/prisma");
const { createTeamInvite, acceptTeamInvite } = await import("../server/services/team-invites");

const TEST_SLUG = "smoke-test-co";

async function main() {
  console.log("▶ Team invite smoke test\n");

  const org = await prisma.organization.findFirst({
    where: { businessProfile: { publicSlug: TEST_SLUG } },
  });
  if (!org) {
    console.error("✗ Smoke org not found");
    process.exit(1);
  }

  const ownerMembership = await prisma.membership.findFirst({
    where: { organizationId: org.id, role: "owner" },
  });
  if (!ownerMembership) {
    console.error("✗ Owner membership not found");
    process.exit(1);
  }

  const inviteEmail = `worker-${randomUUID().slice(0, 8)}@smoke-test.invalid`;
  const created = await createTeamInvite(org.id, ownerMembership.id, inviteEmail, "worker");
  if (!created.ok) {
    console.error("✗ Create invite failed:", created.error);
    process.exit(1);
  }
  console.log(`✓ Created invite for ${inviteEmail}`);

  const invite = await prisma.teamInvite.findFirst({
    where: { organizationId: org.id, email: inviteEmail },
    orderBy: { createdAt: "desc" },
  });
  if (!invite) {
    console.error("✗ Invite row missing");
    process.exit(1);
  }

  const workerUserId = randomUUID();
  const accepted = await acceptTeamInvite(invite.token, workerUserId, inviteEmail);
  if (!accepted.ok) {
    console.error("✗ Accept failed:", accepted.error);
    process.exit(1);
  }
  console.log("✓ Invite accepted");

  const membership = await prisma.membership.findUnique({
    where: { organizationId_userId: { organizationId: org.id, userId: workerUserId } },
  });
  if (!membership || membership.role !== "worker" || membership.status !== "active") {
    console.error("✗ Worker membership not provisioned correctly");
    process.exit(1);
  }
  console.log("✓ Worker membership active");

  await prisma.membership.delete({ where: { id: membership.id } }).catch(() => {});
  await prisma.user.delete({ where: { id: workerUserId } }).catch(() => {});
  await prisma.teamInvite.delete({ where: { id: invite.id } }).catch(() => {});

  console.log("\n✓ Team invite smoke test passed");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

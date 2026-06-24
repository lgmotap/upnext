import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { MembershipRole } from "@/generated/prisma/client";
import { notifyTeamInvite } from "@/server/services/notifications";

const INVITE_TTL_DAYS = 7;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createTeamInvite(
  organizationId: string,
  invitedByMembershipId: string,
  email: string,
  role: Extract<MembershipRole, "worker" | "dispatcher">,
) {
  const normalizedEmail = normalizeEmail(email);

  const existingMember = await prisma.membership.findFirst({
    where: {
      organizationId,
      status: "active",
      user: { email: { equals: normalizedEmail, mode: "insensitive" } },
    },
  });
  if (existingMember) {
    return { ok: false as const, error: "This person is already on your team" };
  }

  await prisma.teamInvite.deleteMany({
    where: { organizationId, email: normalizedEmail, acceptedAt: null },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prisma.teamInvite.create({
    data: {
      organizationId,
      email: normalizedEmail,
      role,
      token,
      invitedById: invitedByMembershipId,
      expiresAt,
    },
    include: {
      organization: { include: { businessProfile: true } },
    },
  });

  await notifyTeamInvite(organizationId, invite.id);

  return { ok: true as const, inviteId: invite.id };
}

export async function acceptTeamInvite(token: string, userId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const invite = await prisma.teamInvite.findUnique({ where: { token } });

  if (!invite) return { ok: false as const, error: "Invite not found" };
  if (invite.acceptedAt) return { ok: false as const, error: "Invite already used" };
  if (invite.expiresAt < new Date()) return { ok: false as const, error: "Invite has expired" };
  if (invite.email !== normalizedEmail) {
    return { ok: false as const, error: "Sign in with the invited email address" };
  }

  const existing = await prisma.membership.findUnique({
    where: { organizationId_userId: { organizationId: invite.organizationId, userId } },
  });
  if (existing?.status === "active") {
    await prisma.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return { ok: true as const, organizationId: invite.organizationId, alreadyMember: true as const };
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: userId },
      create: { id: userId, email: normalizedEmail },
      update: { email: normalizedEmail },
    });

    if (existing) {
      await tx.membership.update({
        where: { id: existing.id },
        data: { role: invite.role, status: "active" },
      });
    } else {
      await tx.membership.create({
        data: {
          organizationId: invite.organizationId,
          userId,
          role: invite.role,
          status: "active",
        },
      });
    }

    await tx.teamInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  return { ok: true as const, organizationId: invite.organizationId };
}

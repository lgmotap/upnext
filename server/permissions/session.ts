import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export type AppSession = {
  userId: string;
  email: string;
  name: string | null;
  organizationId: string;
  membershipId: string;
  role: "owner" | "admin" | "dispatcher" | "worker" | "viewer";
};

/** Returns the active membership for the signed-in user, or null. */
export async function getAppSession(): Promise<AppSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const membership = await prisma.membership.findFirst({
    where: { userId: user.id, status: "active" },
    include: { user: true, organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) return null;

  return {
    userId: user.id,
    email: user.email,
    name: membership.user.name,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role,
  };
}

export async function requireAppSession(): Promise<AppSession> {
  const session = await getAppSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

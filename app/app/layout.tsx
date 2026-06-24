import type { Metadata } from "next";
import { cookies } from "next/headers";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { ONBOARDING_COOKIE } from "@/lib/onboarding/constants";
import { getAppSession } from "@/server/permissions/session";
import { getWorkspaceShellData } from "@/server/services/workspace-shell";
import { prisma } from "@/lib/db/prisma";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "UpNext product workspace for home-service businesses.",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  const userName = session?.name ?? session?.email?.split("@")[0] ?? "User";

  if (session) {
    const completed = await prisma.businessProfile.findUnique({
      where: { organizationId: session.organizationId },
      select: { onboardingCompletedAt: true },
    });
    if (completed?.onboardingCompletedAt) {
      const jar = await cookies();
      if (!jar.get(ONBOARDING_COOKIE)) {
        jar.set(ONBOARDING_COOKIE, session.organizationId, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
    }
  }

  const workspace = session ? await getWorkspaceShellData(session.organizationId, userName) : null;

  return (
    <WorkspaceShell workspace={workspace} userName={userName}>
      {children}
    </WorkspaceShell>
  );
}

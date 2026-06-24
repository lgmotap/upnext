import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { getAppSession } from "@/server/permissions/session";
import { canManageTeam } from "@/server/permissions/can";
import { getWorkspaceShellData } from "@/server/services/workspace-shell";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "UpNext product workspace for home-service businesses.",
  robots: { index: false, follow: false },
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  const userName = session?.name ?? session?.email?.split("@")[0] ?? "User";
  const workspace = session
    ? await getWorkspaceShellData(
        session.organizationId,
        userName,
        canManageTeam(session),
      )
    : null;

  return (
    <WorkspaceShell workspace={workspace} userName={userName}>
      {children}
    </WorkspaceShell>
  );
}

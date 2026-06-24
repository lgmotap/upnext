"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import type { WorkspaceShellData } from "@/server/services/workspace-shell";

export function WorkspaceShell({
  workspace,
  userName,
  children,
}: {
  workspace: WorkspaceShellData | null;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/app/onboarding";

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-background text-ink-900">
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-ink-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-400 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-brand-950"
      >
        Skip to main content
      </a>
      {workspace && <AppSidebar workspace={workspace} />}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar workspace={workspace} userName={userName} />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

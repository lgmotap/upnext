"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import type { WorkspaceShellData } from "@/server/services/workspace-shell";
import { BookedFoxLogo } from "@/components/brand/BookedFoxLogo";
import { appNav, isActive } from "./appNav";

export function AppSidebar({ workspace }: { workspace: WorkspaceShellData }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-brand-950 px-3 py-4 text-white lg:flex">
      <BookedFoxLogo href="/app/dashboard" theme="dark" className="mb-6 px-2" />

      <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-white/5 px-2.5 py-2 ring-1 ring-white/10">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-400 text-sm font-bold text-white">
          {workspace.businessName.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">{workspace.businessName}</p>
          <p className="truncate text-[11px] text-white/50">{workspace.serviceArea}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Main navigation">
        {appNav
          .filter((item) => item.href !== "/app/team" || workspace.canManageTeam)
          .map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href);
          const badge =
            href === "/app/bookings" && workspace.pendingBookings > 0
              ? String(workspace.pendingBookings)
              : undefined;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active
                  ? "border-l-2 border-brand-400 bg-white/10 pl-[10px] text-white"
                  : "border-l-2 border-transparent text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-4" />
              {label}
              {badge && (
                <span className="ml-auto rounded-full bg-brand-400 px-1.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href={`/book/${workspace.publicSlug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white/55 hover:text-brand-400"
      >
        <ExternalLink className="size-3.5" /> View booking page
      </Link>
    </aside>
  );
}

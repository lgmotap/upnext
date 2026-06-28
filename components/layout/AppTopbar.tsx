"use client";

import Link from "next/link";
import { Search, ArrowUpRight } from "lucide-react";
import { BookedFoxLogo } from "@/components/brand/BookedFoxLogo";
import { useCommandPalette } from "@/components/app/CommandPalette";
import type { WorkspaceShellData } from "@/server/services/workspace-shell";
import { MobileNav } from "./MobileNav";
import { NewActionMenu } from "./NewActionMenu";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";
import { UserAvatar } from "@/components/app/UserAvatar";

export function AppTopbar({
  workspace,
  userName,
}: {
  workspace: WorkspaceShellData | null;
  userName: string;
}) {
  const { open } = useCommandPalette();
  const initials =
    (workspace?.ownerInitials ??
      userName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? "")
        .join("")) || "U";

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-100 bg-background/80 px-4 py-3 backdrop-blur-lg sm:px-6">
      {workspace ? <MobileNav workspace={workspace} /> : <MobileNav workspace={null} />}
      <BookedFoxLogo
        href="/app/dashboard"
        theme="light"
        className="shrink-0 lg:hidden"
        priority
      />

      <button
        type="button"
        onClick={open}
        className="relative ml-1 hidden max-w-xs flex-1 items-center rounded-full bg-ink-50 py-2 pl-9 pr-16 text-left text-sm text-ink-500 ring-1 ring-ink-200 hover:ring-brand-300 md:flex"
      >
        <Search className="pointer-events-none absolute left-3 size-4 text-ink-400" />
        <span className="truncate">Search customers, jobs, bookings…</span>
        <kbd className="pointer-events-none absolute right-2 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-ink-400 ring-1 ring-ink-200">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={open}
          className="rounded-full p-2 text-ink-500 ring-1 ring-ink-200 md:hidden"
          aria-label="Search"
        >
          <Search className="size-5" />
        </button>
        <Link
          href="/"
          className="hidden items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-ink-500 hover:text-ink-900 sm:inline-flex"
        >
          Marketing site <ArrowUpRight className="size-3.5" />
        </Link>
        <NewActionMenu />
        {workspace && <NotificationBell workspace={workspace} />}
        {workspace ? (
          <ProfileMenu workspace={workspace} />
        ) : (
          <UserAvatar initials={initials} className="bg-brand-200" />
        )}
      </div>
    </header>
  );
}

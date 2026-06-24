import Link from "next/link";
import { Search, Bell, ArrowUpRight } from "lucide-react";
import { Avatar } from "@/components/app/ui";
import type { WorkspaceShellData } from "@/server/services/workspace-shell";
import { MobileNav } from "./MobileNav";
import { NewActionMenu } from "./NewActionMenu";

export function AppTopbar({
  workspace,
  userName,
}: {
  workspace: WorkspaceShellData | null;
  userName: string;
}) {
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
      <Link href="/app/dashboard" className="flex items-center lg:hidden">
        <span className="text-lg font-bold tracking-tight text-ink-950">UpNext</span>
        <span className="ml-0.5 mt-1.5 size-1.5 rounded-full bg-brand-500" />
      </Link>

      <div className="relative ml-1 hidden max-w-xs flex-1 items-center md:flex">
        <Search className="pointer-events-none absolute left-3 size-4 text-ink-400" />
        <input
          type="search"
          disabled
          title="Search coming soon"
          placeholder="Search customers, jobs, bookings…"
          className="w-full cursor-not-allowed rounded-full bg-ink-50 py-2 pl-9 pr-3 text-sm text-ink-500 ring-1 ring-ink-200 placeholder:text-ink-400"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/"
          className="hidden items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-ink-500 hover:text-ink-900 sm:inline-flex"
        >
          Marketing site <ArrowUpRight className="size-3.5" />
        </Link>
        <NewActionMenu />
        <button
          type="button"
          disabled
          title="Notifications coming soon"
          aria-label="Notifications (coming soon)"
          className="relative cursor-not-allowed rounded-full p-2 text-ink-300"
        >
          <Bell className="size-5" />
        </button>
        <Avatar initials={initials} className="bg-brand-200" />
      </div>
    </header>
  );
}

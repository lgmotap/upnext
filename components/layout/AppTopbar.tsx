import Link from "next/link";
import { Search, Bell, Plus, ArrowUpRight } from "lucide-react";
import { business } from "@/lib/mock/data";
import { Avatar } from "@/components/app/ui";
import { MobileNav } from "./MobileNav";

export function AppTopbar() {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-100 bg-background/80 px-4 py-3 backdrop-blur-lg sm:px-6">
      {/* mobile menu + brand */}
      <MobileNav />
      <Link href="/app/dashboard" className="flex items-center lg:hidden">
        <span className="text-lg font-bold tracking-tight text-ink-950">UpNext</span>
        <span className="ml-0.5 mt-1.5 size-1.5 rounded-full bg-brand-500" />
      </Link>

      <div className="relative ml-1 hidden max-w-xs flex-1 items-center md:flex">
        <Search className="pointer-events-none absolute left-3 size-4 text-ink-400" />
        <input
          type="search"
          placeholder="Search customers, jobs, bookings…"
          className="w-full rounded-full bg-white py-2 pl-9 pr-3 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          href="/"
          className="hidden items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-ink-500 hover:text-ink-900 sm:inline-flex"
        >
          Marketing site <ArrowUpRight className="size-3.5" />
        </Link>
        <button className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-3.5 py-2 text-sm font-bold text-brand-950 transition hover:bg-brand-300">
          <Plus className="size-4" /> New
        </button>
        <button
          aria-label="Notifications"
          className="relative rounded-full p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <Bell className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand-500 ring-2 ring-background" />
        </button>
        <Avatar initials={business.ownerName.split(" ").map((n) => n[0]).join("")} className="bg-brand-200" />
      </div>
    </header>
  );
}

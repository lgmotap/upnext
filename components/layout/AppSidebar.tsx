"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  ClipboardList,
  Users,
  UserCog,
  Wrench,
  CreditCard,
  Settings,
  ExternalLink,
} from "lucide-react";
import { business } from "@/lib/mock/data";

const nav = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/app/bookings", icon: Inbox, badge: "3" },
  { label: "Calendar", href: "/app/calendar", icon: CalendarDays },
  { label: "Jobs", href: "/app/jobs", icon: ClipboardList },
  { label: "Customers", href: "/app/customers", icon: Users },
  { label: "Team", href: "/app/team", icon: UserCog },
  { label: "Services", href: "/app/services", icon: Wrench },
  { label: "Payments", href: "/app/payments", icon: CreditCard },
  { label: "Settings", href: "/app/settings/business", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-brand-950 px-3 py-4 text-white lg:flex">
      <Link href="/app/dashboard" className="mb-6 flex items-center px-2">
        <span className="text-xl font-bold tracking-tight">UpNext</span>
        <span className="ml-0.5 mt-2 size-1.5 rounded-full bg-brand-400" />
      </Link>

      {/* business switcher */}
      <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-white/5 px-2.5 py-2 ring-1 ring-white/10">
        <span className="flex size-8 items-center justify-center rounded-lg bg-brand-400 text-sm font-bold text-brand-950">
          {business.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">{business.name}</p>
          <p className="truncate text-[11px] text-white/50">{business.serviceArea}</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5" aria-label="Product">
        {nav.map(({ label, href, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/") ||
            (href.includes("/settings") && pathname.startsWith("/app/settings"));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="size-4" />
              {label}
              {badge && (
                <span className="ml-auto rounded-full bg-brand-400 px-1.5 text-[10px] font-bold text-brand-950">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href={`/book/${business.slug}`}
        className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white/55 hover:text-brand-300"
      >
        <ExternalLink className="size-3.5" /> View booking page
      </Link>
    </aside>
  );
}

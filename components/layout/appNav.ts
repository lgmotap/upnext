import {
  LayoutDashboard,
  Inbox,
  CalendarDays,
  ClipboardList,
  Users,
  UserCog,
  Wrench,
  CreditCard,
  BarChart3,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

export const appNav: NavItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/app/bookings", icon: Inbox },
  { label: "Calendar", href: "/app/calendar", icon: CalendarDays },
  { label: "Jobs", href: "/app/jobs", icon: ClipboardList },
  { label: "Customers", href: "/app/customers", icon: Users },
  { label: "Team", href: "/app/team", icon: UserCog },
  { label: "Services", href: "/app/services", icon: Wrench },
  { label: "Payments", href: "/app/payments", icon: CreditCard },
  { label: "Communications", href: "/app/communications", icon: MessageSquare },
  { label: "Reports", href: "/app/reports", icon: BarChart3 },
  { label: "Settings", href: "/app/settings/business", icon: Settings },
];

export function isActive(pathname: string, href: string): boolean {
  return (
    pathname === href ||
    pathname.startsWith(href + "/") ||
    (href.includes("/settings") && pathname.startsWith("/app/settings"))
  );
}

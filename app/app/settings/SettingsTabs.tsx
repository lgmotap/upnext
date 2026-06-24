"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Business", href: "/app/settings/business" },
  { label: "Portals", href: "/app/settings/portals" },
  { label: "Availability", href: "/app/settings/availability" },
  { label: "Notifications", href: "/app/settings/notifications" },
  { label: "Billing", href: "/app/settings/billing" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex flex-wrap gap-1.5 border-b border-ink-100 pb-px">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-t-lg px-3.5 py-2 text-sm font-semibold transition ${
              active ? "border-b-2 border-brand-500 text-ink-950" : "text-ink-500 hover:text-ink-900"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

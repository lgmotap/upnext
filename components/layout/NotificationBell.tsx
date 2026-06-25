"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { WorkspaceShellData } from "@/server/services/workspace-shell";

export function NotificationBell({ workspace }: { workspace: WorkspaceShellData }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const badgeCount = workspace.pendingBookings;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          badgeCount > 0 ? `Notifications, ${badgeCount} pending bookings` : "Notifications"
        }
        className="relative rounded-full p-2 text-ink-500 ring-1 ring-ink-200 transition hover:text-ink-900 hover:ring-brand-300"
      >
        <Bell className="size-5" />
        {badgeCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-brand-400 text-[9px] font-bold text-brand-950 ring-2 ring-white">
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-white shadow-float ring-1 ring-ink-100"
        >
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-bold text-ink-950">Notifications</p>
            {badgeCount > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-800">
                {badgeCount} pending
              </span>
            )}
          </div>

          {workspace.notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-500">
              You&apos;re all caught up. New booking requests and job updates appear here.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
              {workspace.notifications.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 transition hover:bg-ink-50 ${
                      item.highlight ? "bg-brand-50/50" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-ink-950">{item.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{item.subtitle}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-2.5">
            <Link
              href="/app/bookings"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              All bookings
            </Link>
            <Link
              href="/app/communications"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-ink-500 hover:text-ink-900"
            >
              Delivery log
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

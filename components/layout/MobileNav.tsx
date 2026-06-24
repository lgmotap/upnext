"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ExternalLink } from "lucide-react";
import type { WorkspaceShellData } from "@/server/services/workspace-shell";
import { appNav, isActive } from "./appNav";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function MobileNav({ workspace }: { workspace: WorkspaceShellData | null }) {
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="rounded-lg p-2 text-ink-700 hover:bg-ink-100"
      >
        <Menu className="size-5" />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[82vw] flex-col bg-brand-950 px-3 py-4 text-white shadow-float">
              <div className="mb-5 flex items-center justify-between px-2">
                <Link href="/app/dashboard" onClick={() => setOpen(false)} className="flex items-center">
                  <span className="text-xl font-bold tracking-tight">UpNext</span>
                  <span className="ml-0.5 mt-2 size-1.5 rounded-full bg-brand-400" />
                </Link>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-1.5 text-white/70 hover:bg-white/10"
                >
                  <X className="size-5" />
                </button>
              </div>

              {workspace && (
                <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-white/5 px-2.5 py-2 ring-1 ring-white/10">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-brand-400 text-sm font-bold text-brand-950">
                    {workspace.businessName.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold">{workspace.businessName}</p>
                    <p className="truncate text-[11px] text-white/50">{workspace.serviceArea}</p>
                  </div>
                </div>
              )}

              <nav className="flex flex-1 flex-col gap-0.5" aria-label="Product">
                {appNav.map(({ label, href, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  const badge =
                    workspace && href === "/app/bookings" && workspace.pendingBookings > 0
                      ? String(workspace.pendingBookings)
                      : undefined;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
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

              {workspace && (
                <Link
                  href={`/book/${workspace.publicSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white/55 hover:text-brand-300"
                >
                  <ExternalLink className="size-3.5" /> View booking page
                </Link>
              )}
            </aside>
          </div>,
          document.body,
        )}
    </div>
  );
}

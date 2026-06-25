"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, CreditCard, Key, LogOut, Settings } from "lucide-react";
import { UserAvatar } from "@/components/app/UserAvatar";
import { signOutAction } from "@/server/actions/auth";
import type { WorkspaceShellData } from "@/server/services/workspace-shell";

const ROLE_LABELS: Record<WorkspaceShellData["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  dispatcher: "Dispatcher",
  worker: "Worker",
  viewer: "Viewer",
};

export function ProfileMenu({ workspace }: { workspace: WorkspaceShellData }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        aria-label="Account menu"
        className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 ring-1 ring-ink-200 transition hover:ring-brand-300"
      >
        <UserAvatar
          initials={workspace.ownerInitials}
          imageUrl={workspace.userAvatarUrl}
          className="bg-brand-200"
        />
        <ChevronDown className={`hidden size-3.5 text-ink-400 sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl bg-white py-1.5 shadow-float ring-1 ring-ink-100"
        >
          <div className="border-b border-ink-100 px-3.5 py-2.5">
            <p className="truncate text-sm font-semibold text-ink-950">{workspace.userName}</p>
            <p className="truncate text-xs text-ink-500">{workspace.userEmail}</p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">
              {ROLE_LABELS[workspace.role]}
            </p>
          </div>

          <Link
            href="/app/settings/business"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
          >
            <Settings className="size-4 text-ink-500" />
            Settings
          </Link>

          {workspace.canManageBilling && (
            <>
              <Link
                href="/app/settings/billing"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
              >
                <CreditCard className="size-4 text-ink-500" />
                Billing
              </Link>
              <Link
                href="/app/settings/api"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
              >
                <Key className="size-4 text-ink-500" />
                API & webhooks
              </Link>
            </>
          )}

          <form action={signOutAction} className="border-t border-ink-100 pt-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-ink-800 hover:bg-ink-50"
            >
              <LogOut className="size-4 text-ink-500" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

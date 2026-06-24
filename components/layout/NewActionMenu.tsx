"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, ChevronDown, Inbox, Wrench, ClipboardList, Users } from "lucide-react";

const actions = [
  { label: "New booking", href: "/app/bookings/new", icon: Inbox },
  { label: "Add service", href: "/app/services?new=1", icon: Wrench },
  { label: "View jobs", href: "/app/jobs", icon: ClipboardList },
  { label: "Add team member", href: "/app/team", icon: Users },
] as const;

export function NewActionMenu() {
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
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-400 px-3.5 py-2 text-sm font-bold text-brand-950 transition hover:bg-brand-300"
      >
        <Plus className="size-4" /> New
        <ChevronDown className={`size-3.5 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] rounded-xl bg-white py-1.5 shadow-float ring-1 ring-ink-100"
        >
          {actions.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-medium text-ink-800 hover:bg-ink-50"
            >
              <Icon className="size-4 text-ink-500" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

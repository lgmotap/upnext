"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { nav, site } from "@/lib/config";
import { PrimaryCTA } from "@/components/ui/CTAButton";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-white/80 backdrop-blur-lg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-950 focus:shadow-soft focus:ring-2 focus:ring-brand-400"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
        <Link href="/" className="group flex items-center" aria-label={`${site.name} home`}>
          <span className="text-xl font-bold tracking-tight text-ink-950">{site.name}</span>
          <span className="ml-0.5 mt-2 size-1.5 rounded-full bg-brand-500 transition-transform group-hover:scale-125" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-600 transition hover:bg-ink-50 hover:text-ink-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <PrimaryCTA size="md" compact className="hidden sm:inline-flex" />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="rounded-lg p-2 text-ink-700 hover:bg-ink-50 lg:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-ink-100 bg-white px-5 py-4 lg:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 sm:hidden" onClick={() => setOpen(false)}>
              <PrimaryCTA size="md" compact className="w-full" />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

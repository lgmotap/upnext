import Link from "next/link";
import { Sparkles } from "lucide-react";
import { site } from "@/lib/config";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Before & After", href: "#before-after" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Join the waitlist", href: "#waitlist" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Who it's for", href: "#who-its-for" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "mailto:hello@example.com" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="#" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-700 shadow-md">
              <Sparkles className="size-4 text-white" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight text-ink-950">{site.name}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">{site.description}</p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mb-4 text-sm font-bold text-ink-950">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-ink-500 transition hover:text-brand-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-ink-100">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-ink-400 sm:px-8">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Currently in pre-launch · early access coming soon</p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";
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
      { label: "Contact", href: `mailto:${site.contactEmail}` },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-brand-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="flex items-center" aria-label={`${site.name} home`}>
            <span className="text-xl font-bold tracking-tight text-white">{site.name}</span>
            <span className="ml-0.5 mt-2 size-1.5 rounded-full bg-brand-400" />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">{site.description}</p>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="mb-4 text-sm font-bold text-white">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/60 transition hover:text-brand-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-white/45 sm:px-8">
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
          <p>Currently in pre-launch · early access coming soon</p>
        </div>
      </div>
    </footer>
  );
}

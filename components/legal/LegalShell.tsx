import Link from "next/link";
import { site } from "@/lib/config";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-ink-900">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="text-lg font-bold text-brand-950">
            {site.name}
          </Link>
          <Link href="/" className="text-sm font-medium text-ink-500 hover:text-brand-700">
            ← Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-ink-950">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated {updated}</p>
        <div className="prose prose-ink mt-8 max-w-none space-y-6 text-sm leading-relaxed text-ink-700">{children}</div>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-ink-950">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className="font-semibold text-brand-700 hover:underline"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

export function MailtoLink({ email }: { email: string }) {
  return <LegalLink href={`mailto:${email}`}>{email}</LegalLink>;
}

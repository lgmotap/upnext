import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy policy for ${site.name}.`,
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="June 24, 2026">
      <p>
        {site.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides booking and business software for home-service
        providers. This policy describes how we handle information when you use our website and product.
      </p>
      <Section title="Information we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details you provide (name, email, business name).</li>
          <li>Customer and job data you enter into the product (contacts, addresses, schedules, notes).</li>
          <li>Payment metadata from Stripe (we do not store card numbers).</li>
          <li>Usage and error diagnostics when analytics/monitoring are enabled.</li>
        </ul>
      </Section>
      <Section title="How we use information">
        <ul className="list-disc space-y-2 pl-5">
          <li>Operate the booking, scheduling, CRM, and payment features you use.</li>
          <li>Send transactional emails (confirmations, reminders) on your behalf to your customers.</li>
          <li>Improve reliability, security, and support.</li>
        </ul>
      </Section>
      <Section title="Sharing">
        <p>
          We use subprocessors such as Supabase (hosting/database/auth), Stripe (payments), Resend (email), and
          optional analytics providers. We do not sell personal information.
        </p>
      </Section>
      <Section title="Retention & security">
        <p>
          Data is retained while your account is active and as needed for legal obligations. Access is restricted by
          role and organization (tenant isolation).
        </p>
      </Section>
      <Section title="Contact">
        <p>
          Questions: <a href="mailto:hello@example.com" className="font-semibold text-brand-700 hover:underline">hello@example.com</a>
        </p>
      </Section>
    </LegalShell>
  );
}

function LegalShell({
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-ink-950">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

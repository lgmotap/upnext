import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${site.name}.`,
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="June 24, 2026">
      <p>
        By using {site.name}, you agree to these terms. If you do not agree, do not use the service.
      </p>
      <Section title="Service">
        <p>
          {site.name} provides online booking, scheduling, customer management, team tools, and payment tracking for
          home-service businesses. Features may change during early access.
        </p>
      </Section>
      <Section title="Your account">
        <ul className="list-disc space-y-2 pl-5">
          <li>You are responsible for activity under your account and for your team members you invite.</li>
          <li>You must provide accurate business and contact information.</li>
          <li>You must comply with applicable laws when contacting customers and collecting payment.</li>
        </ul>
      </Section>
      <Section title="Customer data">
        <p>
          You control customer data you upload. You grant us a limited license to host and process that data solely to
          provide the service (including sending emails and payment links you trigger).
        </p>
      </Section>
      <Section title="Payments">
        <p>
          Payment processing is provided by Stripe. {site.name} is not a bank. Payouts and disputes are handled under
          Stripe&apos;s terms between you and Stripe.
        </p>
      </Section>
      <Section title="Availability">
        <p>
          We aim for high availability but do not guarantee uninterrupted service during beta/early access.
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

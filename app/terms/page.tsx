import Link from "next/link";
import type { Metadata } from "next";
import { LegalLink, LegalShell, MailtoLink, Section } from "@/components/legal/LegalShell";
import { legalEntity, legalUpdated, site } from "@/lib/config";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${site.name} — online booking, scheduling, and business software for home-service providers.`,
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated={legalUpdated}>
      <Section title="1. Agreement to these terms">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the {site.name} website and
          software at <LegalLink href={site.url}>{site.url.replace("https://", "")}</LegalLink> (the
          &ldquo;Service&rdquo;), operated by {legalEntity.name} (registry code {legalEntity.registryCode}), an Estonian
          private limited company (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;).
        </p>
        <p>
          By creating an account, joining the waitlist, submitting a booking through a merchant&apos;s booking page, or
          otherwise using the Service, you agree to these Terms and our{" "}
          <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
            Privacy Policy
          </Link>
          , which is incorporated by reference. If you do not agree, do not use the Service.
        </p>
        <p>
          If you use the Service on behalf of a business, you represent that you have authority to bind that business to
          these Terms, and &ldquo;you&rdquo; refers to that business.
        </p>
      </Section>

      <Section title="2. The Service">
        <p>
          {site.name} provides online booking, scheduling, customer management, crew tools, notifications, and payment
          features for home-service businesses. The Service may include:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>A merchant owner application at <code className="text-xs">/app</code></li>
          <li>Public booking pages at <code className="text-xs">/book/[slug]</code></li>
          <li>Customer portals and crew mobile experiences</li>
          <li>Email and optional SMS notifications triggered by merchants or automated rules</li>
          <li>Payment links and Stripe Connect integration</li>
        </ul>
        <p>
          We may add, change, or remove features at any time. During early access or beta periods, the Service may be
          incomplete, change frequently, or be unavailable without notice.
        </p>
      </Section>

      <Section title="3. Eligibility and accounts">
        <ul className="list-disc space-y-2 pl-5">
          <li>You must be at least 18 years old and able to form a binding contract to create a merchant account.</li>
          <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li>
            You are responsible for all activity under your account, including actions by team members, dispatchers, and
            workers you invite.
          </li>
          <li>You must provide accurate business and contact information and keep it up to date.</li>
          <li>
            You must comply with all applicable laws when using the Service, including laws governing marketing,
            telecommunications, consumer protection, and payment collection in the jurisdictions where you operate.
          </li>
        </ul>
      </Section>

      <Section title="4. Early access and beta">
        <p>
          {site.name} may be offered on a waitlist, early-access, or beta basis. During these periods:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Features, pricing, and availability may change without notice.</li>
          <li>We do not guarantee uptime, data retention, or support response times.</li>
          <li>We may limit access, invite users in batches, or discontinue early access at any time.</li>
        </ul>
        <p>
          Feedback you provide may be used to improve the Service without obligation or compensation to you.
        </p>
      </Section>

      <Section title="5. Customer data and your responsibilities">
        <p>
          <strong>You control customer data.</strong> Information about your customers, jobs, and business that you or
          your end customers enter into the Service (&ldquo;Customer Data&rdquo;) remains yours. You grant us a limited,
          worldwide, non-exclusive license to host, copy, transmit, and process Customer Data solely to provide and
          improve the Service, including sending communications and payment links you trigger and displaying data to
          users you authorize.
        </p>
        <p>You agree that:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            You are the data controller (or equivalent) for Customer Data and are responsible for having a lawful basis
            to collect and use it.
          </li>
          <li>
            You will maintain a clear, accurate privacy notice for your customers that explains how you (and we on your
            behalf) collect and use their information.
          </li>
          <li>
            You will obtain any consents required before sending marketing messages or SMS to your customers through the
            Service.
          </li>
          <li>
            You will not upload unlawful, infringing, or harmful content, or use the Service to harass, spam, or mislead
            customers.
          </li>
        </ul>
        <p>
          We act as a data processor for Customer Data as described in our{" "}
          <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
            Privacy Policy
          </Link>
          . Enterprise customers requiring a separate Data Processing Addendum may contact us at{" "}
          <MailtoLink email={site.contactEmail} />.
        </p>
      </Section>

      <Section title="6. Acceptable use">
        <p>You may not, and may not permit others to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Reverse engineer, scrape, or probe the Service except as permitted by law.</li>
          <li>Circumvent access controls, rate limits, or tenant isolation.</li>
          <li>Use the Service to transmit malware, phishing, or unlawful content.</li>
          <li>Resell or sublicense the Service without our written consent.</li>
          <li>Use the Service in a manner that interferes with or degrades the Service for others.</li>
          <li>Misrepresent your identity or affiliation when booking or communicating through the Service.</li>
        </ul>
        <p>
          We may suspend or terminate access if we reasonably believe you have violated these Terms or applicable law.
        </p>
      </Section>

      <Section title="7. Payments">
        <p>
          Payment processing is provided by Stripe, Inc. through Stripe Connect and related products. {site.name} is not
          a bank, money transmitter, or payment processor. We do not store full payment card numbers.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Your use of Stripe is subject to{" "}
            <LegalLink href="https://stripe.com/legal">Stripe&apos;s terms and policies</LegalLink>.
          </li>
          <li>Payouts, refunds, chargebacks, and disputes are handled between you and Stripe under applicable rules.</li>
          <li>You are responsible for pricing, taxes, and compliance with payment laws in your jurisdiction.</li>
        </ul>
      </Section>

      <Section title="8. Third-party services">
        <p>
          The Service integrates with third-party providers (including Supabase, Vercel, Resend, Stripe, PostHog,
          Sentry, Google, and optionally Twilio) as described in our{" "}
          <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
            Privacy Policy
          </Link>
          . Your use of those services may be subject to their separate terms. We are not responsible for third-party
          websites or services linked from the Service.
        </p>
      </Section>

      <Section title="9. Availability and support">
        <p>
          We strive to keep the Service available and secure but do not guarantee uninterrupted or error-free operation.
          Scheduled maintenance, third-party outages, and force majeure events may affect availability.
        </p>
        <p>
          Unless we agree otherwise in writing, support is provided on a reasonable-efforts basis during early access.
          No service-level agreement applies unless explicitly stated in a signed order form.
        </p>
      </Section>

      <Section title="10. Intellectual property">
        <p>
          We and our licensors own all rights in the Service, including software, branding, documentation, and design
          (&ldquo;Company Materials&rdquo;). Except for the limited rights expressly granted in these Terms, no license
          is granted to Company Materials.
        </p>
        <p>
          You retain ownership of Customer Data and your business content. You grant us permission to use aggregated,
          de-identified data derived from use of the Service to improve and market the Service.
        </p>
      </Section>

      <Section title="11. Disclaimers and limitation of liability">
        <p>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND,
          WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
          PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {legalEntity.name.toUpperCase()} AND ITS AFFILIATES, OFFICERS,
          EMPLOYEES, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
          DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE
          TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE
          (12) MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED US DOLLARS (USD $100).
        </p>
        <p>
          Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest
          extent permitted by law.
        </p>
      </Section>

      <Section title="12. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate your access if you breach these Terms,
          if required by law, or if we discontinue the Service.
        </p>
        <p>
          Upon termination, your right to access the Service ends. We may delete or retain Customer Data as described in
          our Privacy Policy and as required by law. Sections that by their nature should survive termination (including
          intellectual property, disclaimers, limitation of liability, and governing law) will survive.
        </p>
      </Section>

      <Section title="13. Governing law and disputes">
        <p>
          These Terms are governed by the laws of Estonia, without regard to conflict-of-law principles. The courts of
          Tallinn, Estonia shall have exclusive jurisdiction over disputes arising from or relating to these Terms or
          the Service, except where mandatory consumer protection laws in your country of residence require otherwise.
        </p>
        <p>These Terms are written in English. Any translated version is provided for convenience only.</p>
      </Section>

      <Section title="14. Changes to these Terms">
        <p>
          We may modify these Terms from time to time. The current version will be posted at{" "}
          <LegalLink href={`${site.url}/terms`}>{site.url}/terms</LegalLink> with an updated &ldquo;Last
          updated&rdquo; date. Material changes may be communicated by email or in-product notice. Continued use after
          changes become effective constitutes acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="15. Contact">
        <p>For questions about these Terms:</p>
        <p className="mt-2">
          <strong>{legalEntity.name}</strong>
          <br />
          Registry code: {legalEntity.registryCode}
          <br />
          {legalEntity.address}
          <br />
          Email: <MailtoLink email={site.contactEmail} />
        </p>
        <p className="mt-2">
          Privacy enquiries:{" "}
          <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
            Privacy Policy
          </Link>{" "}
          — see contact details there.
        </p>
      </Section>
    </LegalShell>
  );
}

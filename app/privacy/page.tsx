import Link from "next/link";
import type { Metadata } from "next";
import { LegalLink, LegalShell, MailtoLink, Section, SubSection } from "@/components/legal/LegalShell";
import { legalEntity, legalUpdated, privacyEmail, site } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses, and protects your data when you use our booking and business software.`,
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated={legalUpdated}>
      <Section title="1. Introduction">
        <p>
          {legalEntity.name} (registry code {legalEntity.registryCode}, registered in Estonia) operates the{" "}
          {site.name} website and software at{" "}
          <LegalLink href={site.url}>{site.url.replace("https://", "")}</LegalLink> (collectively, the
          &ldquo;Service&rdquo;). In this Privacy Policy, &ldquo;{site.name}&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, or &ldquo;our&rdquo; refers to {legalEntity.name} as the provider of {site.name}.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, share, and protect personal information when you visit our
          marketing website, join our waitlist, create a business account, book a service through a merchant&apos;s
          public booking page, use the crew mobile experience, or otherwise interact with the Service.
        </p>
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will post the revised
          policy on this page and update the &ldquo;Last updated&rdquo; date. Your continued use of the Service after
          changes are posted constitutes acceptance of the revised policy.
        </p>
        <p>
          This policy should be read together with our{" "}
          <Link href="/terms" className="font-semibold text-brand-700 hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </Section>

      <Section title="2. Who this policy covers">
        <p>This Privacy Policy applies to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Website visitors</strong> who browse our marketing site or legal pages.
          </li>
          <li>
            <strong>Waitlist sign-ups</strong> who request early access before or during launch.
          </li>
          <li>
            <strong>Merchants</strong> (business owners, admins, dispatchers, and invited team members) who use the
            owner app, crew tools, or related features.
          </li>
          <li>
            <strong>End customers</strong> who submit booking requests, use a customer portal, or receive communications
            from a merchant through {site.name}.
          </li>
          <li>
            <strong>Crew and field workers</strong> assigned to jobs through a merchant account.
          </li>
        </ul>
      </Section>

      <Section title="3. Our roles: controller and processor">
        <p>
          Privacy laws distinguish between the party that decides <em>why</em> and <em>how</em> personal information is
          processed (the &ldquo;controller&rdquo; or &ldquo;business&rdquo;) and the party that processes information
          on someone else&apos;s behalf (the &ldquo;processor&rdquo; or &ldquo;service provider&rdquo;).
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>When we act as controller:</strong> We decide how to process information relating to our marketing
            site, waitlist, merchant account registration, billing relationship with merchants, and product analytics
            where we define the purposes.
          </li>
          <li>
            <strong>When we act as processor:</strong> Merchants use {site.name} to manage their customers, jobs, and
            payments. For customer and job data that a merchant enters or collects through the Service, the merchant is
            the controller and we process that data solely to provide the Service on the merchant&apos;s instructions,
            as described in our Terms of Service.
          </li>
          <li>
            <strong>Stripe:</strong> Payment card processing is handled by Stripe, Inc. Stripe acts as an independent
            controller (or co-controller, depending on context) for payment data under{" "}
            <LegalLink href="https://stripe.com/privacy">Stripe&apos;s Privacy Policy</LegalLink>. {site.name} does
            not store full payment card numbers.
          </li>
        </ul>
        <p>
          If you are an end customer of a merchant using {site.name} and wish to exercise privacy rights regarding data
          the merchant collected about you, please contact that merchant first. We will assist merchants in responding
          to lawful requests where required.
        </p>
        <p>
          Merchants must maintain an accurate, accessible privacy notice for their own customers and comply with laws
          applicable to their business. See our{" "}
          <Link href="/terms" className="font-semibold text-brand-700 hover:underline">
            Terms of Service
          </Link>{" "}
          for merchant obligations.
        </p>
      </Section>

      <Section title="4. Information we collect">
        <SubSection title="4.1 Waitlist and marketing">
          <p>When you join our waitlist or contact us through the marketing site, we may collect:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>First name and email address</li>
            <li>Business name, service type, team size, and current tools you use</li>
            <li>Referral or page source (for example, which page you signed up from)</li>
          </ul>
        </SubSection>

        <SubSection title="4.2 Merchant accounts and team members">
          <p>When you register, onboard, or manage a business on {site.name}, we may collect:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Account details (name, email, profile information)</li>
            <li>Business profile (business name, address, timezone, currency, service settings, notification preferences)</li>
            <li>Team invitations, roles, and membership data</li>
            <li>API keys, webhook configuration, and integration settings you configure</li>
            <li>Stripe Connect account identifiers and payment configuration metadata (not full card numbers)</li>
            <li>Activity and audit logs related to your use of the Service</li>
          </ul>
        </SubSection>

        <SubSection title="4.3 End customers">
          <p>
            When a merchant uses {site.name} to manage bookings, or when you submit a booking through a public booking
            page or customer portal, we may process on the merchant&apos;s behalf:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Contact information (name, email, phone)</li>
            <li>Service addresses and booking details (requested times, services, add-ons, notes you provide)</li>
            <li>Booking and job status, assignment information, and completion notes visible to the customer</li>
            <li>Customer portal login and session data when portal access is enabled</li>
            <li>Payment status, amounts, and Stripe-related metadata (we do not store full card numbers)</li>
          </ul>
        </SubSection>

        <SubSection title="4.4 Crew and job operations">
          <p>When crew or field workers use assigned job tools, we may process:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Job assignments, check-in timestamps, and checklist completion</li>
            <li>Job photos uploaded to document work (stored in private cloud storage with access controls)</li>
            <li>On-the-way and running-late status updates sent to customers when triggered</li>
          </ul>
        </SubSection>

        <SubSection title="4.5 Technical and log data">
          <p>When you use the Service, we automatically collect certain technical information, such as:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>IP address, browser type, device information, and operating system</li>
            <li>Pages viewed, actions taken, and timestamps (through product analytics when enabled)</li>
            <li>Authentication session cookies and similar technologies needed to keep you signed in</li>
            <li>Server, application, and error logs (including error reports sent to our monitoring provider when configured)</li>
          </ul>
          <p className="mt-2">
            When address autocomplete is enabled, Google Maps/Places may receive address search queries from your browser
            under Google&apos;s terms. See{" "}
            <LegalLink href="https://policies.google.com/privacy">Google&apos;s Privacy Policy</LegalLink>.
          </p>
        </SubSection>
      </Section>

      <Section title="5. How we use information and legal bases">
        <p>We use personal information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide, operate, maintain, and improve the Service</li>
          <li>Authenticate users and enforce role-based access within each merchant organization</li>
          <li>Process booking requests, jobs, schedules, payments, and notifications you or a merchant trigger</li>
          <li>Send transactional emails and, when configured, SMS messages on a merchant&apos;s behalf</li>
          <li>Respond to support requests and investigate security or fraud concerns</li>
          <li>Analyze product usage to improve reliability and features</li>
          <li>Comply with legal obligations and enforce our Terms of Service</li>
          <li>Send waitlist updates and, with consent where required, product and launch communications</li>
        </ul>
        <p className="mt-4">
          Where the GDPR or UK GDPR applies, we rely on the following lawful bases (whichever applies to the specific
          processing):
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Contract:</strong> Processing necessary to provide the Service you or a merchant signed up for.
          </li>
          <li>
            <strong>Legitimate interests:</strong> Securing the Service, preventing abuse, improving features, and
            communicating about the Service in a proportionate way.
          </li>
          <li>
            <strong>Consent:</strong> Waitlist marketing and optional communications where consent is required; you may
            withdraw consent at any time.
          </li>
          <li>
            <strong>Legal obligation:</strong> Record-keeping, tax, or compliance requirements.
          </li>
        </ul>
      </Section>

      <Section title="6. Communications">
        <p>
          <strong>Transactional messages</strong> (booking confirmations, reminders, payment links, crew assignments, and
          similar) are sent as part of the Service when a merchant enables them or triggers them. These are not
          marketing messages.
        </p>
        <p>
          <strong>Product and waitlist messages</strong> from {site.name} may include early-access updates, launch
          announcements, or feature news. You can opt out of non-essential marketing emails by using the unsubscribe
          link in any such message or by contacting us at <MailtoLink email={privacyEmail} />.
        </p>
      </Section>

      <Section title="7. Cookies and tracking technologies">
        <p>We use cookies and similar technologies for the following purposes:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Essential cookies:</strong> Authentication and session management (for example, Supabase auth
            cookies) required to sign in and use the product securely.
          </li>
          <li>
            <strong>Product analytics:</strong> When configured, PostHog may use cookies or local storage to understand
            how the Service is used across product routes. This helps us measure feature adoption and improve the
            product.
          </li>
          <li>
            <strong>Marketing analytics:</strong> Google Tag Manager loads only on indexable marketing routes (
            <code className="text-xs">/</code>, <code className="text-xs">/privacy</code>,{" "}
            <code className="text-xs">/terms</code>) — not on merchant app, booking, auth, or crew surfaces. Tags
            configured in GTM (for example, Google Analytics) are subject to those providers&apos; policies.
          </li>
          <li>
            <strong>Error monitoring:</strong> When configured, Sentry may collect diagnostic data about errors to help
            us fix issues.
          </li>
        </ul>
        <p className="mt-2">
          You can control cookies through your browser settings. Disabling essential cookies may prevent you from signing
          in. For Google ad personalization settings, visit{" "}
          <LegalLink href="https://www.google.com/settings/ads">Google Ads Settings</LegalLink>.
        </p>
      </Section>

      <Section title="8. Sharing, subprocessors, and sale of data">
        <p>
          <strong>We do not sell personal information.</strong> We do not share personal information for cross-context
          behavioral advertising in exchange for money. California residents: we do not &ldquo;sell&rdquo; or
          &ldquo;share&rdquo; personal information as those terms are defined under the CCPA/CPRA.
        </p>
        <p>We share personal information only as described below:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Service providers (subprocessors)</strong> who process data on our behalf under contractual
            obligations, including:
          </li>
        </ul>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-ink-200">
                <th className="py-2 pr-4 font-semibold">Provider</th>
                <th className="py-2 pr-4 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody className="text-ink-600">
              <tr className="border-b border-ink-100">
                <td className="py-2 pr-4">Supabase</td>
                <td className="py-2 pr-4">Authentication, database, file storage</td>
              </tr>
              <tr className="border-b border-ink-100">
                <td className="py-2 pr-4">Vercel</td>
                <td className="py-2 pr-4">Application hosting and edge infrastructure</td>
              </tr>
              <tr className="border-b border-ink-100">
                <td className="py-2 pr-4">Stripe</td>
                <td className="py-2 pr-4">Payment processing and Connect accounts</td>
              </tr>
              <tr className="border-b border-ink-100">
                <td className="py-2 pr-4">Resend</td>
                <td className="py-2 pr-4">Transactional and waitlist email delivery</td>
              </tr>
              <tr className="border-b border-ink-100">
                <td className="py-2 pr-4">Twilio (optional)</td>
                <td className="py-2 pr-4">SMS notifications when enabled by a merchant</td>
              </tr>
              <tr className="border-b border-ink-100">
                <td className="py-2 pr-4">PostHog</td>
                <td className="py-2 pr-4">Product analytics</td>
              </tr>
              <tr className="border-b border-ink-100">
                <td className="py-2 pr-4">Sentry</td>
                <td className="py-2 pr-4">Error monitoring and diagnostics</td>
              </tr>
              <tr className="border-b border-ink-100">
                <td className="py-2 pr-4">Google (GTM / Maps)</td>
                <td className="py-2 pr-4">Marketing tags (GTM) and address autocomplete (Maps, when enabled)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5">
          <li>
            <strong>Merchants:</strong> Customer data you submit through a booking page is accessible to the merchant
            whose business you booked.
          </li>
          <li>
            <strong>Legal and safety:</strong> When required by law, court order, or to protect rights, safety, and
            security.
          </li>
          <li>
            <strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, with notice
            where required by law.
          </li>
        </ul>
      </Section>

      <Section title="9. International data transfers">
        <p>
          {legalEntity.name} is established in Estonia (European Union). Our service providers may process personal
          information in the United States, the European Union, and other countries where they operate data centers.
        </p>
        <p>
          When we transfer personal information from the EEA, UK, or Switzerland to countries that have not received an
          adequacy decision, we rely on appropriate safeguards such as Standard Contractual Clauses or equivalent
          mechanisms, where applicable. Contact us for more information about transfer safeguards.
        </p>
      </Section>

      <Section title="10. Data retention">
        <p>
          We retain personal information for as long as needed to provide the Service and fulfill the purposes described
          in this policy, unless a longer retention period is required or permitted by law.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Merchant accounts:</strong> Retained while the account is active and for a reasonable period
            afterward for backups, disputes, and legal compliance.
          </li>
          <li>
            <strong>Customer data processed for merchants:</strong> Retained according to the merchant&apos;s use of the
            Service and deletion requests; merchants may export or request deletion through their account or by
            contacting us.
          </li>
          <li>
            <strong>Waitlist data:</strong> Retained until you unsubscribe, we launch publicly, or you request deletion.
          </li>
          <li>
            <strong>Logs and analytics:</strong> Retained for a limited period appropriate to security and product
            improvement, then deleted or aggregated.
          </li>
        </ul>
      </Section>

      <Section title="11. Security">
        <p>
          We implement administrative, technical, and organizational measures designed to protect personal information,
          including encryption in transit (TLS), tenant isolation by organization, and role-based access controls.
          Job photos are stored in private storage buckets with signed URL access.
        </p>
        <p>
          No method of transmission or storage is completely secure. We cannot guarantee absolute security. If you
          believe your account has been compromised, contact us promptly at <MailtoLink email={site.contactEmail} />.
        </p>
      </Section>

      <Section title="12. Your privacy rights">
        <p>
          Depending on where you live, you may have rights to access, correct, delete, restrict, or port your personal
          information, object to certain processing, or withdraw consent where processing is consent-based.
        </p>
        <SubSection title="GDPR / UK GDPR">
          <p>
            If you are in the EEA or UK, you may lodge a complaint with your local supervisory authority. We encourage
            you to contact us first so we can address your concern.
          </p>
        </SubSection>
        <SubSection title="California (CCPA / CPRA)">
          <p>
            California residents may request disclosure of categories of personal information collected, sources,
            purposes, and categories of third parties with whom information is shared; request deletion; and correct
            inaccurate information. We do not sell or share personal information for cross-context behavioral
            advertising. We do not discriminate against you for exercising these rights.
          </p>
        </SubSection>
        <p className="mt-4">
          To exercise your rights, email <MailtoLink email={privacyEmail} /> with enough information to verify your
          request. We will respond within the timeframe required by applicable law. End customers should contact their
          merchant first for data the merchant controls.
        </p>
      </Section>

      <Section title="13. Children">
        <p>
          The Service is intended for businesses and adults. It is not directed to children under 16 (or under 13 in the
          United States). We do not knowingly collect personal information from children. If you believe we have
          collected information from a child, contact us at <MailtoLink email={privacyEmail} /> and we will take steps
          to delete it.
        </p>
      </Section>

      <Section title="14. Changes to this policy">
        <p>
          We may revise this Privacy Policy from time to time. The updated version will be posted at{" "}
          <LegalLink href={`${site.url}/privacy`}>{site.url}/privacy</LegalLink> with a new &ldquo;Last updated&rdquo;
          date. Material changes may also be communicated by email or in-product notice where appropriate.
        </p>
      </Section>

      <Section title="15. Contact us">
        <p>For privacy questions or to exercise your rights, contact:</p>
        <p className="mt-2">
          <strong>{legalEntity.name}</strong>
          <br />
          Registry code: {legalEntity.registryCode}
          <br />
          {legalEntity.address}
          <br />
          Email: <MailtoLink email={privacyEmail} />
        </p>
        <p className="mt-2">
          General support (non-privacy): <MailtoLink email={site.contactEmail} />
        </p>
      </Section>
    </LegalShell>
  );
}

import { site, faqs } from "@/lib/config";

/**
 * Structured data for SEO rich results and GEO (generative-engine answer
 * extraction). Emits Organization, WebSite, SoftwareApplication, and FAQPage.
 * Rendered once in the root layout.
 */
export function JsonLd() {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      email: site.contactEmail,
      logo: `${site.url}/icon-512.png`,
      description: site.shortDescription,
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      name: site.name,
      url: site.url,
      description: site.shortDescription,
      publisher: { "@id": `${site.url}/#organization` },
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${site.url}/#software`,
      name: site.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: site.description,
      url: site.url,
      publisher: { "@id": `${site.url}/#organization` },
      audience: {
        "@type": "Audience",
        audienceType:
          "Home-service businesses — cleaning, lawn care, handyman, painting, pressure washing, pet care, car wash, roofing",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Early-access waitlist",
        availability: "https://schema.org/PreOrder",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${site.url}/#faq`,
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  const json = { "@context": "https://schema.org", "@graph": graph };

  return (
    <script
      type="application/ld+json"
      // Static, trusted content — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

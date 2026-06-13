import { site, faqs } from "@/lib/config";

/**
 * Structured data for SEO rich results and GEO (generative-engine answer
 * extraction). Emits a SoftwareApplication describing what UpNext is, and a
 * FAQPage mirroring the on-page FAQ. Rendered once in the root layout.
 */
export function JsonLd() {
  const graph = [
    {
      "@type": "SoftwareApplication",
      name: site.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      description: site.description,
      url: site.url,
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
      },
    },
    {
      "@type": "FAQPage",
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

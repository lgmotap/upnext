import { faqs, phase, site, socialProfiles, type LaunchPhase } from "@/lib/config";

const AUDIENCE_TYPE =
  "Home-service businesses and contractors — residential and commercial cleaning, lawn care, handyman, plumbing, HVAC, painting, pressure washing, pet care, mobile car wash, roofing; solo operators and teams of 2–50";

export function getSchemaOffers(overridePhase?: LaunchPhase) {
  const p = overridePhase ?? phase;
  if (p === "launch") {
    return {
      "@type": "Offer" as const,
      price: "0",
      priceCurrency: "USD",
      description: "Free trial — self-serve signup",
      availability: "https://schema.org/InStock",
    };
  }
  return {
    "@type": "Offer" as const,
    price: "0",
    priceCurrency: "USD",
    description: "Early-access waitlist",
    availability: "https://schema.org/PreOrder",
  };
}

export function buildJsonLdGraph(overridePhase?: LaunchPhase) {
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    email: site.contactEmail,
    logo: {
      "@type": "ImageObject",
      url: `${site.url}/icon-512.png`,
      width: 512,
      height: 512,
    },
    description: site.shortDescription,
  };

  if (socialProfiles.length > 0) {
    organization.sameAs = [...socialProfiles];
  }

  return [
    organization,
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
        audienceType: AUDIENCE_TYPE,
      },
      offers: getSchemaOffers(overridePhase),
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
}

export function buildJsonLd(overridePhase?: LaunchPhase) {
  return {
    "@context": "https://schema.org",
    "@graph": buildJsonLdGraph(overridePhase),
  };
}

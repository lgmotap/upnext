import { buildJsonLd } from "@/lib/seo/schema";

/**
 * Structured data for SEO rich results and GEO. Rendered in <head> from root layout.
 */
export function JsonLd() {
  const json = buildJsonLd();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

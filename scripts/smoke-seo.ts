/**
 * Smoke: marketing SEO / GEO baseline (bookedfox.com).
 * Run: npm run smoke:seo
 * Requires a running server — default http://localhost:3000
 * Override: SMOKE_BASE_URL=https://bookedfox.com npm run smoke:seo
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { faqs, phase, seoMeta, site } from "../lib/config";
import { buildJsonLd } from "../lib/seo/schema";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

const BASE = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function extractTag(html: string, pattern: RegExp): string | null {
  const m = html.match(pattern);
  return m?.[1] ?? null;
}

async function fetchText(path: string): Promise<{ status: number; text: string }> {
  const res = await fetch(`${BASE}${path}`, { redirect: "follow" });
  const text = await res.text();
  return { status: res.status, text };
}

async function main() {
  console.log(`▶ SEO smoke test (${BASE})\n`);

  const meta = seoMeta[phase];

  assert(meta.title.length <= 60, `Title too long (${meta.title.length}): ${meta.title}`);
  assert(meta.description.length <= 155, `Description too long (${meta.description.length})`);
  assert(meta.title.startsWith("BookedFox"), "Title must start with BookedFox");
  console.log("✓ seoMeta char limits and brand-first title");

  const { status: homeStatus, text: home } = await fetchText("/");
  assert(homeStatus === 200, `GET / returned ${homeStatus} (is the dev server running?)`);
  assert(!home.includes('content="noindex"'), "Homepage must not have noindex");
  console.log("✓ Homepage 200 and indexable");

  const title = extractTag(home, /<title>([^<]*)<\/title>/);
  assert(!!title && title.length <= 60, `Rendered title missing or too long: ${title ?? "null"}`);
  assert(!!title?.startsWith("BookedFox"), `Rendered title must start with BookedFox: ${title}`);

  const description = extractTag(home, /<meta name="description" content="([^"]*)"/);
  assert(!!description && description.length <= 155, `Meta description too long (${description?.length ?? 0})`);
  assert(
    description!.toLowerCase().includes("waitlist") || phase === "launch",
    "Waitlist phase description should mention waitlist",
  );

  const canonical = extractTag(home, /<link rel="canonical" href="([^"]*)"/);
  assert(canonical === site.url || canonical === `${site.url}/`, `Canonical expected ${site.url}, got ${canonical}`);

  assert(home.includes("og:image"), "Missing og:image");
  assert(home.includes("opengraph-image"), "og:image should reference opengraph-image");

  const jsonLdMatch = home.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert(!!jsonLdMatch?.[1], "Missing JSON-LD script");
  const jsonLdRaw = jsonLdMatch![1]!;
  const graph = JSON.parse(jsonLdRaw) as { "@graph": { "@type": string }[] };
  const types = graph["@graph"].map((n) => n["@type"]);
  for (const t of ["Organization", "WebSite", "SoftwareApplication", "FAQPage"]) {
    assert(types.includes(t), `JSON-LD missing @type ${t}`);
  }
  if (phase === "waitlist") {
    assert(jsonLdRaw.includes("PreOrder"), "Waitlist phase JSON-LD should include PreOrder");
  }
  console.log("✓ Homepage metadata, canonical, OG image, JSON-LD graph");

  const faqAnswerCount = (home.match(/<details/g) ?? []).length;
  assert(faqAnswerCount >= faqs.length, `Expected ${faqs.length} FAQ <details>, found ${faqAnswerCount}`);
  console.log(`✓ ${faqAnswerCount} FAQ items in SSR HTML`);

  const featureList = (home.match(/<strong class="font-bold text-ink-950">/g) ?? []).length;
  assert(featureList >= 8, `Expected Bold-Colon feature list items, found ${featureList}`);
  console.log("✓ Feature list Bold-Colon pattern present");

  const { status: signInStatus, text: signIn } = await fetchText("/sign-in");
  assert(signInStatus === 200, `/sign-in returned ${signInStatus}`);
  assert(signIn.includes("noindex"), "/sign-in must have noindex");
  console.log("✓ /sign-in is noindex");

  const { status: robotsStatus, text: robots } = await fetchText("/robots.txt");
  assert(robotsStatus === 200, `robots.txt returned ${robotsStatus}`);
  assert(robots.includes("Disallow: /app/"), "robots.txt must disallow /app/");
  assert(robots.includes("Disallow: /book/"), "robots.txt must disallow /book/");
  assert(robots.includes(`Sitemap: ${site.url}/sitemap.xml`), "robots.txt must link sitemap");
  console.log("✓ robots.txt");

  const { status: sitemapStatus, text: sitemap } = await fetchText("/sitemap.xml");
  assert(sitemapStatus === 200, `sitemap.xml returned ${sitemapStatus}`);
  assert(sitemap.includes("<loc>https://bookedfox.com</loc>"), "Sitemap missing home URL");
  assert(!sitemap.includes("/app/"), "Sitemap must not include /app/");
  const locCount = (sitemap.match(/<loc>/g) ?? []).length;
  assert(locCount === 3, `Sitemap should have 3 URLs, found ${locCount}`);
  console.log("✓ sitemap.xml (3 marketing URLs)");

  const expected = buildJsonLd();
  assert(JSON.stringify(expected).includes("BusinessApplication"), "Schema helper sanity check");
  console.log("✓ lib/seo/schema.ts builds valid graph");

  const { status: llmsStatus, text: llms } = await fetchText("/llms.txt");
  assert(llmsStatus === 200, `llms.txt returned ${llmsStatus}`);
  assert(llms.includes("bookedfox.com"), "llms.txt must reference bookedfox.com");
  assert(llms.includes("Do not crawl"), "llms.txt must list blocked paths");
  console.log("✓ llms.txt");

  const root = join(import.meta.dirname, "..");
  const noindexLayouts = [
    "app/app/layout.tsx",
    "app/(auth)/layout.tsx",
    "app/crew/layout.tsx",
    "app/book/layout.tsx",
    "app/my/layout.tsx",
  ];
  for (const rel of noindexLayouts) {
    const src = readFileSync(join(root, rel), "utf8");
    assert(src.includes("index: false"), `${rel} must export robots index: false`);
  }
  console.log("✓ non-marketing layouts declare noindex");

  console.log("\n✅ SEO smoke passed\n");
}

main().catch((err) => {
  console.error("\n❌ SEO smoke failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

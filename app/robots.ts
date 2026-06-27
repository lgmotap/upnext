import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

/** Non-marketing paths — never index on bookedfox.com (see tasks/seogeo/README.md). */
const DISALLOW = [
  "/app/",
  "/crew/",
  "/api/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/auth/",
  "/book/",
  "/my/",
  "/accept-invite/",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...DISALLOW],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}

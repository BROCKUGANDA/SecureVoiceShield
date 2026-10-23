import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shield.securevoice.example";

/**
 * Robots policy (spec 14): the public good pages are open; the API and its
 * evidence are not crawlable. Model-training crawlers are kept to the
 * learn/awareness surface only — the sandbox and API are off-limits.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/"] },
      {
        // Training crawlers: only the public-awareness surface, never the API.
        userAgent: ["GPTBot", "CCBot", "ClaudeBot", "Google-Extended", "anthropic-ai"],
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}

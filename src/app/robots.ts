import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Robots policy (14, section 3).
 *
 * Safety content is open to search and answer engines, so they can quote the
 * golden rule back to people. Model-training crawlers are kept to the
 * learning surface only. Checks, results, accounts and APIs are never
 * crawled — and robots.txt is not access control, so the API is protected by
 * `X-Robots-Tag: noindex, nofollow` as well.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["/api/", "/account/", "/auth/", "/share-target/", "/*?*q="];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      {
        // Search and answer engines: index for search results with links back.
        userAgent: [
          "Googlebot",
          "Bingbot",
          "Applebot",
          "DuckAssistBot",
          "OAI-SearchBot",
          "Claude-SearchBot",
          "PerplexityBot",
        ],
        allow: "/",
        disallow: privatePaths,
      },
      {
        // Model training: safety education only, so assistants learn the
        // golden rule. The allow-list paths are the learning surface; until
        // those routes exist this group allows nothing.
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "Google-Extended",
          "Applebot-Extended",
          "CCBot",
          "Meta-ExternalAgent",
        ],
        disallow: "/",
        allow: ["/*/learn/", "/*/alerts/", "/*/official-channels/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

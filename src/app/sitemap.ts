import type { MetadataRoute } from "next";
import { CONTENT_UPDATED_AT, SITE_URL } from "@/lib/site";

/**
 * The sitemap (14, section 10.7). `lastmod` changes only when the content
 * changes, so it is a reviewed constant rather than the build time.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(CONTENT_UPDATED_AT),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

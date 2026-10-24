import type { MetadataRoute } from "next";
import { CONTENT_UPDATED_AT, SITE_URL } from "@/lib/site";
import { LOCALES, hreflangAlternates, localeUrl } from "@/lib/i18n";

/**
 * The sitemap (14, section 10.7). `lastmod` changes only when the content
 * changes, so it is a reviewed constant rather than the build time.
 *
 * Every entry — the root picker and each locale page — lists the whole
 * hreflang set, so a crawler that reads the sitemap alone still sees the
 * eleven locales and the x-default target.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = hreflangAlternates();
  const lastModified = new Date(CONTENT_UPDATED_AT);

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages },
    },
    ...LOCALES.map((entry) => ({
      url: localeUrl(entry.code),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
      alternates: { languages },
    })),
  ];
}

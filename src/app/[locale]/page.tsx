import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShieldPage } from "@/components/shield/page-body";
import { HtmlLang } from "@/components/shield/html-lang";
import {
  LOCALE_CODES,
  getDictionary,
  hreflangAlternates,
  localeEntry,
  localeFromSegment,
  localePath,
  localeUrl,
  ogLocale,
} from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";

/**
 * The eleven locale routes (14, section 2).
 *
 * Each page is the same page, in that locale's language, for that locale's
 * market: its own copy, its own direction, its own market line and its own
 * self-referencing canonical. Every page lists the whole set in `hreflang`
 * plus `x-default`, and the links are reciprocal — scripts/check-hreflang.ts
 * proves it against a running server.
 */

/** Only the eleven locales exist; anything else is a 404, never a redirect. */
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale: locale.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: segment } = await params;
  const locale = localeFromSegment(segment);
  if (!locale) return {};

  const d = getDictionary(locale);
  const entry = localeEntry(locale);
  // The dictionary carries the whole title, so the English pages keep the
  // title they always had and every other locale follows the metadata
  // standard: "{Page} · SecureVoice Shield" (14, section 5).
  const title = d.meta.title.text;
  const description = d.meta.description.text;
  const alternates = hreflangAlternates();

  return {
    title: { absolute: title },
    description,
    // One canonical per page, pointing at itself, and the full reciprocal
    // hreflang set (14, sections 2 and 5).
    alternates: {
      canonical: localePath(locale),
      languages: alternates,
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: SITE_NAME,
      url: localeUrl(locale),
      locale: ogLocale(locale),
      alternateLocale: LOCALE_CODES.filter((code) => code !== locale).map(ogLocale),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    other: {
      "twitter:url": localeUrl(locale),
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: segment } = await params;
  const locale = localeFromSegment(segment);
  if (!locale) notFound();

  const d = getDictionary(locale);

  return (
    <>
      <HtmlLang lang={d.locale} dir={d.dir} />
      <ShieldPage d={d} />
    </>
  );
}

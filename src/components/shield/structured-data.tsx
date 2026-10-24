/**
 * Structured data for search and answer engines (14, section 6).
 *
 * Every block here is a server component, so the pages ship no extra
 * JavaScript for them (14, section 9). The payload is JSON.stringify'd and
 * every "<" is escaped, so a "</script>" inside any value can never break
 * out of the tag.
 */

import { MARKETS, SITE_NAME, SITE_URL } from "@/lib/site";

const SCHEMA_CONTEXT = "https://schema.org";

/** The languages Shield answers in (14, section 6). */
const AVAILABLE_LANGUAGES = ["en", "ar", "hi", "ur", "sw", "lg"];

/** A question and its answer, exactly as the FAQ accordion shows them. */
export interface FaqItem {
  q: string;
  a: string;
}

function serialize(data: unknown): string {
  // Every "<" is written as its JSON escape, so a "</script>" inside any
  // value can never close the tag early.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}

/**
 * Organization — every page (14, section 6). Name, logo and the customer
 * support contact point for the four launch markets.
 */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": SCHEMA_CONTEXT,
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon`,
        // sameAs is left out on purpose: Shield has no verified social
        // profile or app-store listing yet, and inventing profile URLs is
        // worse than having none. Add them here the day they exist.
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            areaServed: [...MARKETS],
            availableLanguage: AVAILABLE_LANGUAGES,
            url: `${SITE_URL}/official-channels/`,
          },
        ],
      }}
    />
  );
}

/**
 * WebSite — the home page (14, section 6). No sitelinks search box:
 * Google retired that feature in 2024.
 */
export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": SCHEMA_CONTEXT,
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: "en",
      }}
    />
  );
}

/**
 * FAQPage — the questions and answers that are already on the page, for
 * machine readability (14, section 6). The pairs come from the FAQ
 * accordion itself, so the two can never drift apart.
 */
export function FaqJsonLd({ items }: { items: readonly FaqItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": SCHEMA_CONTEXT,
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      }}
    />
  );
}

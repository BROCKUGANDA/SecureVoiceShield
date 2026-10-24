import type { Metadata } from "next";
import { GoldenRuleBar, SiteHeader } from "@/components/shield/site-chrome";
import { LocalePicker } from "@/components/shield/locale-picker";
import { HtmlLang } from "@/components/shield/html-lang";
import { getDictionary, hreflangAlternates } from "@/lib/i18n";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * The root path is a market and language picker (14, section 2).
 *
 * The content that used to live here now lives at the eleven locale
 * paths, each with its own market copy, its own direction and its own
 * self-referencing canonical. The picker is not a redirect and not a dead
 * end: it keeps the golden rule and links onward to every locale, so
 * inbound links to "/" still land on something useful.
 */
const DICTIONARY = getDictionary("en-AE");

export const metadata: Metadata = {
  title: { absolute: "SecureVoice Shield — choose your market and language" },
  description:
    "Shield answers in eleven locales across four markets. Pick your market and language — each page has its own contacts, its own examples and its own canonical URL.",
  alternates: {
    canonical: "/",
    // The picker is the x-default target, and it lists the whole set too.
    languages: hreflangAlternates(),
  },
  openGraph: {
    title: "SecureVoice Shield — choose your market and language",
    description:
      "Shield answers in eleven locales across four markets. Pick your market and language — each page has its own contacts, its own examples and its own canonical URL.",
    type: "website",
    siteName: SITE_NAME,
    url: `${SITE_URL}/`,
    locale: "en_UG",
    alternateLocale: ["ar_AE", "hi_AE", "ur_AE", "en_KE", "sw_KE", "en_TZ", "sw_TZ", "en_AE", "lg_UG", "sw_UG"],
  },
  robots: { index: true, follow: true },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" lang="en" dir="ltr">
      <HtmlLang lang="en" dir="ltr" />
      <GoldenRuleBar d={DICTIONARY} />
      <SiteHeader d={DICTIONARY} />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <LocalePicker />
      </main>
      <footer className="mt-auto border-t border-border/70 bg-console py-8 text-console-ink">
        <div className="mx-auto max-w-7xl px-4 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-console-ink/50 sm:px-6">
          SecureVoice Shield · the golden rule: Shield never calls you first
        </div>
      </footer>
    </div>
  );
}

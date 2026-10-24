/**
 * Locale routing, dictionaries and hreflang (14, sections 2, 5 and 7.1).
 *
 * The root path `/` is a market and language picker. The eleven locale
 * paths below carry the content, each with its own market copy, its own
 * direction and its own self-referencing canonical. Every locale page
 * lists the whole set in `hreflang`, plus `x-default` pointing at the
 * picker, and every link is reciprocal — scripts/check-hreflang.ts proves
 * it against a running server.
 *
 * A dictionary is a partial overlay on the English one. A line that has
 * not been translated is marked `untranslated` and the page says so, so
 * nothing is ever silently shown in English (14, section 12: language QA
 * is a market go-live gate).
 */

import { CONTENT_UPDATED_AT, SITE_URL } from "@/lib/site";
import type { Verdict } from "@/lib/shield-engine";
import { en } from "@/lib/dictionaries/en";
import { sw } from "@/lib/dictionaries/sw";
import { lg } from "@/lib/dictionaries/lg";
import { ar } from "@/lib/dictionaries/ar";
import { hi } from "@/lib/dictionaries/hi";
import { ur } from "@/lib/dictionaries/ur";
import type { Copy } from "@/lib/dictionaries/copy";

export type { Copy };
export { pending, reviewed, untranslated } from "@/lib/dictionaries/copy";

/* ------------------------------------------------------------------ */
/* Locales                                                             */
/* ------------------------------------------------------------------ */

/** The eleven locale codes (14, section 2). */
export const LOCALE_CODES = [
  "en-AE",
  "ar-AE",
  "hi-AE",
  "ur-AE",
  "en-KE",
  "sw-KE",
  "en-UG",
  "lg-UG",
  "sw-UG",
  "en-TZ",
  "sw-TZ",
] as const;

export type Locale = (typeof LOCALE_CODES)[number];
export type LocaleLanguage = "en" | "ar" | "hi" | "ur" | "sw" | "lg";
export type Market = "AE" | "KE" | "UG" | "TZ";
export type Direction = "ltr" | "rtl";

/** The review state of a locale's copy (14, section 12). */
export interface ReviewState {
  /**
   * "reviewed" only when a native speaker signed the copy off. Everything
   * else is "pendingNativeReview" — a market go-live gate, not a detail.
   */
  state: "reviewed" | "pendingNativeReview";
  /** Who reviewed the copy, when it was reviewed. */
  reviewedBy?: string;
  reviewedAt?: string;
  /** Why the state is what it is. Shown on the picker. */
  note: string;
}

export interface LocaleEntry {
  /** The hreflang code, e.g. "sw-TZ". */
  code: Locale;
  /** The language code, e.g. "sw". */
  language: LocaleLanguage;
  /** The language's name in English. */
  languageName: string;
  /** The language's name in that language. */
  endonym: string;
  /** The launch market this page belongs to. */
  market: Market;
  /** Text direction — Arabic and Urdu read right to left. */
  dir: Direction;
  /** The URL segment, e.g. "sw-tz". */
  segment: string;
  /** The public path, always with a trailing slash. */
  path: string;
  /** The review state of this locale's copy. */
  review: ReviewState;
}

const REVIEWED_EN: ReviewState = {
  state: "reviewed",
  reviewedBy: "SecureVoice trust content",
  reviewedAt: CONTENT_UPDATED_AT,
  note: "English source copy, reviewed before publishing.",
};

const PENDING_NATIVE: ReviewState = {
  state: "pendingNativeReview",
  note: "Translated by the team. Native-speaker review is still a go-live gate (14, section 12).",
};

/**
 * Every locale, in the order they appear on the picker. The endonym is the
 * language's own name — a person who cannot read the rest of the picker
 * still finds their language here (14, section 7.1).
 */
export const LOCALES: readonly LocaleEntry[] = [
  {
    code: "en-AE",
    language: "en",
    languageName: "English",
    endonym: "English",
    market: "AE",
    dir: "ltr",
    segment: "en-ae",
    path: "/en-ae/",
    review: REVIEWED_EN,
  },
  {
    code: "ar-AE",
    language: "ar",
    languageName: "Arabic",
    endonym: "العربية",
    market: "AE",
    dir: "rtl",
    segment: "ar-ae",
    path: "/ar-ae/",
    review: PENDING_NATIVE,
  },
  {
    code: "hi-AE",
    language: "hi",
    languageName: "Hindi",
    endonym: "हिन्दी",
    market: "AE",
    dir: "ltr",
    segment: "hi-ae",
    path: "/hi-ae/",
    review: PENDING_NATIVE,
  },
  {
    code: "ur-AE",
    language: "ur",
    languageName: "Urdu",
    endonym: "اردو",
    market: "AE",
    dir: "rtl",
    segment: "ur-ae",
    path: "/ur-ae/",
    review: PENDING_NATIVE,
  },
  {
    code: "en-KE",
    language: "en",
    languageName: "English",
    endonym: "English",
    market: "KE",
    dir: "ltr",
    segment: "en-ke",
    path: "/en-ke/",
    review: REVIEWED_EN,
  },
  {
    code: "sw-KE",
    language: "sw",
    languageName: "Kiswahili",
    endonym: "Kiswahili",
    market: "KE",
    dir: "ltr",
    segment: "sw-ke",
    path: "/sw-ke/",
    review: PENDING_NATIVE,
  },
  {
    code: "en-UG",
    language: "en",
    languageName: "English",
    endonym: "English",
    market: "UG",
    dir: "ltr",
    segment: "en-ug",
    path: "/en-ug/",
    review: REVIEWED_EN,
  },
  {
    code: "lg-UG",
    language: "lg",
    languageName: "Luganda",
    endonym: "Luganda",
    market: "UG",
    dir: "ltr",
    segment: "lg-ug",
    path: "/lg-ug/",
    review: PENDING_NATIVE,
  },
  {
    code: "sw-UG",
    language: "sw",
    languageName: "Kiswahili",
    endonym: "Kiswahili",
    market: "UG",
    dir: "ltr",
    segment: "sw-ug",
    path: "/sw-ug/",
    review: PENDING_NATIVE,
  },
  {
    code: "en-TZ",
    language: "en",
    languageName: "English",
    endonym: "English",
    market: "TZ",
    dir: "ltr",
    segment: "en-tz",
    path: "/en-tz/",
    review: REVIEWED_EN,
  },
  {
    code: "sw-TZ",
    language: "sw",
    languageName: "Kiswahili",
    endonym: "Kiswahili",
    market: "TZ",
    dir: "ltr",
    segment: "sw-tz",
    path: "/sw-tz/",
    review: PENDING_NATIVE,
  },
];

/** True when the value is one of the eleven locale codes. */
export function isLocale(value: string): value is Locale {
  return (LOCALE_CODES as readonly string[]).includes(value);
}

/** The public path of a locale, e.g. "sw-TZ" → "/sw-tz/". */
export function localePath(locale: Locale): string {
  return `/${locale.toLowerCase()}/`;
}

/** The locale behind a URL segment, e.g. "sw-tz" → "sw-TZ". */
export function localeFromSegment(segment: string): Locale | null {
  const found = LOCALES.find((entry) => entry.segment === segment.toLowerCase());
  return found ? found.code : null;
}

/** The entry for a locale code. */
export function localeEntry(locale: Locale): LocaleEntry {
  const found = LOCALES.find((entry) => entry.code === locale);
  if (!found) throw new Error(`Unknown locale: ${locale}`);
  return found;
}

/** The absolute URL of a locale page. */
export function localeUrl(locale: Locale): string {
  return `${SITE_URL}${localePath(locale)}`;
}

/**
 * The hreflang set every page publishes: the eleven locales plus
 * `x-default`, which points at the market and language picker (14, section 2).
 */
export function hreflangAlternates(): Record<string, string> {
  const alternates: Record<string, string> = { "x-default": `${SITE_URL}/` };
  for (const entry of LOCALES) alternates[entry.code] = localeUrl(entry.code);
  return alternates;
}

/** The `og:locale` value of a locale, e.g. "sw_TZ". */
export function ogLocale(locale: Locale): string {
  return locale.replace("-", "_");
}

/* ------------------------------------------------------------------ */
/* Dictionaries                                                        */
/* ------------------------------------------------------------------ */

export interface Dictionary {
  /** The locale this dictionary is written for. */
  locale: Locale;
  /** The market this dictionary is written for. */
  market: Market;
  /** The text direction of this locale. */
  dir: Direction;

  meta: {
    title: Copy;
    description: Copy;
  };

  review: {
    badge: Copy;
    badgeDetail: Copy;
    pendingTitle: Copy;
    untranslatedTitle: Copy;
  };

  nav: {
    homeLabel: Copy;
    brand: Copy;
    demo: Copy;
    verdicts: Copy;
    how: Copy;
    markets: Copy;
    agents: Copy;
    audit: Copy;
    runCheck: Copy;
    skipToContent: Copy;
    openMenu: Copy;
    closeMenu: Copy;
    main: Copy;
    mobile: Copy;
  };

  goldenRule: {
    items: Copy[];
    screenReader: Copy;
  };

  hero: {
    badge: Copy;
    headlineA: Copy;
    headlineB: Copy;
    lede: Copy;
    ctaPrimary: Copy;
    ctaSecondary: Copy;
    stats: { v: Copy; l: Copy }[];
    channels: Copy[];
    visual: {
      plane: Copy;
      streaming: Copy;
      guard: Copy;
      fusedVerdict: Copy;
      caution: Copy;
      danger: Copy;
      dangerMeta: Copy;
      verified: Copy;
      verifiedMeta: Copy;
      detectors: { id: string; label: Copy; state: Copy }[];
    };
  };

  stats: {
    ariaLabel: Copy;
    items: { v: Copy; l: Copy }[];
  };

  sandbox: {
    eyebrow: Copy;
    title: Copy;
    lede: Copy;
    caption: Copy;
    consoleNote: Copy;
    tabs: {
      number: Copy;
      voice: Copy;
      guardian: Copy;
      verified: Copy;
    };
  };

  verdicts: {
    eyebrow: Copy;
    title: Copy;
    lede: Copy;
    goldenRuleLabel: Copy;
    goldenRuleLine: Copy;
    goldenRuleBody: Copy;
    items: {
      key: Verdict;
      name: Copy;
      wording: Copy;
      advice: Copy;
      shape: Copy;
      color: Copy;
      pulses: number;
    }[];
    pulseOne: Copy;
    pulseMany: Copy;
  };

  signals: {
    eyebrow: Copy;
    title: Copy;
    lede: Copy;
    items: { id: Copy; title: Copy; body: Copy }[];
    floor: { label: Copy; body: Copy };
  };

  products: {
    eyebrow: Copy;
    title: Copy;
    lede: Copy;
    publicName: Copy;
    publicBadge: Copy;
    businessName: Copy;
    businessBadge: Copy;
    publicFeatures: { t: Copy; d: Copy }[];
    businessFeatures: { t: Copy; d: Copy }[];
    apiNote: Copy;
    failSafe: Copy;
  };

  markets: {
    eyebrow: Copy;
    title: Copy;
    lede: Copy;
    yourMarket: Copy;
    zeroRated: Copy;
    patternLabel: Copy;
    awareness: Copy;
    items: {
      code: string;
      name: Copy;
      languages: Copy[];
      channels: Copy[];
      rails: Copy;
      pattern: Copy;
    }[];
  };

  agents: {
    eyebrow: Copy;
    title: Copy;
    lede: Copy;
    items: { name: Copy; channel: Copy; purpose: Copy; budget: Copy }[];
    invariants: { id: string; label: Copy }[];
  };

  architecture: {
    eyebrow: Copy;
    title: Copy;
    lede: Copy;
    planes: { name: Copy; items: Copy[]; note?: Copy }[];
    connectors: Copy[];
    cards: { t: Copy; d: Copy }[];
  };

  audit: {
    eyebrow: Copy;
    title: Copy;
    lede: Copy;
    consoleNote: Copy;
  };

  faq: {
    eyebrow: Copy;
    title: Copy;
    lede: Copy;
    items: { q: Copy; a: Copy }[];
  };

  footer: {
    about: Copy;
    demoNote: Copy;
    exploreLabel: Copy;
    explore: { href: string; label: Copy }[];
    marketsLabel: Copy;
    markets: Copy[];
    dataInCountry: Copy;
    docsLabel: Copy;
    docs: Copy;
    goldenRule: Copy;
    copyright: Copy;
    disclaimer: Copy;
  };

  /** The market-specific lines for this locale's own market. */
  local: {
    marketName: Copy;
    marketNote: Copy;
  };
}

/** A dictionary that may be incomplete — missing lines fall back to English, marked. */
export type DeepPartial<T> = T extends Copy
  ? Partial<Copy>
  : T extends readonly (infer U)[]
    ? DeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: DeepPartial<T[K]> }
      : T;

export type PartialDictionary = DeepPartial<
  Omit<Dictionary, "locale" | "market" | "dir">
>;

/** The partial dictionaries, keyed by locale. English is the full source. */
const OVERLAYS: Partial<Record<Locale, PartialDictionary>> = {
  "ar-AE": ar,
  "hi-AE": hi,
  "ur-AE": ur,
  "sw-KE": sw.ke,
  "lg-UG": lg,
  "sw-UG": sw.ug,
  "sw-TZ": sw.tz,
};

function isCopy(value: unknown): value is Copy {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Copy).text === "string"
  );
}

/**
 * Merge a partial dictionary over the English source.
 *
 * A missing line is not dropped and not silently English: it comes back
 * flagged `untranslated`, and the page marks it.
 */
function merge(base: unknown, over: unknown): unknown {
  if (isCopy(base)) {
    const candidate = over as Partial<Copy> | undefined;
    if (!candidate || typeof candidate.text !== "string") {
      return { text: base.text, pendingNativeReview: true, untranslated: true };
    }
    return {
      text: candidate.text,
      pendingNativeReview: candidate.pendingNativeReview ?? true,
      untranslated: candidate.untranslated ?? false,
    };
  }
  if (Array.isArray(base)) {
    const items = Array.isArray(over) ? over : [];
    return base.map((item, index) => merge(item, items[index]));
  }
  if (base && typeof base === "object") {
    const source = (over ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(base)) {
      merged[key] = merge(value, source[key]);
    }
    return merged;
  }
  return over ?? base;
}

/** The full dictionary for a locale — English where nothing else is written. */
export function getDictionary(locale: Locale): Dictionary {
  const entry = localeEntry(locale);
  if (locale === "en-AE" || locale === "en-KE" || locale === "en-UG" || locale === "en-TZ") {
    // The English locales share the English source copy; only the market
    // line differs, and it comes from that market's own card.
    const marketItem = en.markets.items.find((item) => item.code === entry.market);
    return {
      ...(en as Dictionary),
      locale,
      market: entry.market,
      dir: entry.dir,
      local: {
        marketName: marketItem?.name ?? en.local.marketName,
        marketNote: marketItem?.pattern ?? en.local.marketNote,
      },
    };
  }
  const overlay = OVERLAYS[locale];
  const merged = merge(en, overlay ?? {}) as Dictionary;
  return { ...merged, locale, market: entry.market, dir: entry.dir };
}

/** The number of lines on a page that are still waiting for native review. */
export function pendingLineCount(dictionary: Dictionary): number {
  let count = 0;
  const walk = (value: unknown): void => {
    if (isCopy(value)) {
      if (value.pendingNativeReview) count += 1;
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach(walk);
    }
  };
  walk(dictionary);
  return count;
}

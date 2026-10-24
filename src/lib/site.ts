/**
 * Public site coordinates (14, section 2). One source of truth so the
 * canonical URLs, the robots policy, the sitemap, the official-channels list
 * and the structured data can never disagree.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://shield.securevoiceai.me"
).replace(/\/$/, "");

export const SITE_NAME = "SecureVoice Shield";

export const MARKETS = ["AE", "KE", "UG", "TZ"] as const;

export const LOCALES = [
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

/** The golden rule, in one place — the site and the API both quote it. */
export const GOLDEN_RULE = "Shield never calls you first. Never share your PIN or any code.";

/**
 * When the public content was last reviewed. The sitemap uses this so
 * `lastmod` changes only when the content changes (14, section 10.7).
 */
export const CONTENT_UPDATED_AT = "2026-10-24T00:00:00.000Z";

/** What Shield never does (14, section 10.8). */
export const NEVER_DOES = [
  "call you first",
  "ask for a PIN, OTP or password",
  "ask you to send money",
  "send links by SMS",
] as const;

import { MARKETS, NEVER_DOES, SITE_NAME, SITE_URL } from "@/lib/site";
import { REGISTRY } from "@/lib/demo-seed";
import { signDocument, signingAvailable } from "@/lib/signing";

/**
 * GET /.well-known/shield-official.json — the signed list of every official
 * channel (14, section 10.8). The site, the apps, the agents' registry and
 * the press kit all read this one file, so nobody can publish a number that
 * disagrees with it.
 *
 * Every phone number below comes from the verified-call registry
 * (src/lib/demo-seed.ts). A channel the registry does not hold yet is
 * published as `null` or an empty list — never as a number typed by hand,
 * because a wrong "official" number is an impersonation risk, not a typo.
 *
 * The signature is a detached ES256 signature over the canonical JSON of
 * this document with the `signature` member removed. To verify:
 *
 *   1. download the document,
 *   2. delete the `signature` member,
 *   3. re-serialise it with object keys sorted recursively and no
 *      insignificant whitespace,
 *   4. verify the base64url signature in `signature.jws` against
 *      /.well-known/shield-signing-key.pem.
 *
 * When no signing key is configured the document says so: `signature` is
 * null and `signatureStatus` is "unconfigured", so the file never implies a
 * signature it does not have.
 */

const CACHE_CONTROL = "max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/** The Android package id of the Shield app (14, sections 10.2 and 10.8). */
const ANDROID_PACKAGE = "me.securevoiceai.shield";

/**
 * RFC 8785-style canonicalisation: object keys sorted, no insignificant
 * whitespace. The same function is used by the verifier, so the signature
 * can be recomputed from the published document alone.
 */
function canonicalJson(value: unknown): string {
  if (value === undefined) return "null";
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return "{" + entries.map(([k, v]) => JSON.stringify(k) + ":" + canonicalJson(v)).join(",") + "}";
}

/** The public hosts Shield answers on, derived from the canonical site URL. */
function domains(): string[] {
  const host = new URL(SITE_URL).host;
  return [host, `docs.${host}`, `status.${host}`];
}

/** Per-market official channels, built from the registry. */
function markets() {
  const byMarket: Record<string, typeof REGISTRY> = {};
  for (const entry of REGISTRY) {
    (byMarket[entry.market] ??= []).push(entry);
  }

  const out: Record<
    string,
    {
      whatsapp: string | null;
      smsSenderIds: string[];
      ussd: string | null;
      guardianMergeNumbers: string[];
      verifiedCallNumbers: string[];
      verifiedCallBanks: string[];
      publishedChannels: string[];
    }
  > = {};

  for (const market of MARKETS) {
    const entries = byMarket[market] ?? [];
    out[market] = {
      // The registry holds verified bank call numbers only. The Shield
      // WhatsApp line, the SMS sender ID, the USSD short code and the
      // Guardian merge number are assigned per market and are published
      // here as soon as they are registered — until then they stay empty
      // rather than being guessed.
      whatsapp: null,
      smsSenderIds: [],
      ussd: null,
      guardianMergeNumbers: [],
      verifiedCallNumbers: entries.map((e) => e.e164),
      verifiedCallBanks: entries.map((e) => e.bankName),
      publishedChannels: ["verifiedCallNumbers"],
    };
  }

  return out;
}

export async function GET() {
  const updated = new Date().toISOString();
  const available = signingAvailable();

  const body = {
    schema: `${SITE_URL}/schemas/shield-official.v1.json`,
    name: SITE_NAME,
    updated,
    neverDoes: [...NEVER_DOES],
    domains: domains(),
    apps: {
      android: ANDROID_PACKAGE,
      // No App Store id exists yet; the key stays so consumers can tell
      // "not published" from "not applicable".
      ios: null as string | null,
    },
    markets: markets(),
    registry: {
      source: "verified-call registry (src/lib/demo-seed.ts)",
      note: "Every phone number in this document comes from the registry. A channel that is not in the registry is published as null or an empty list, never as a guessed number.",
    },
    canonicalization:
      "Object keys sorted recursively, no insignificant whitespace. The signature covers this document with the \"signature\" member removed.",
    publicKey: `${SITE_URL}/.well-known/shield-signing-key.pem`,
    signatureStatus: available ? "signed" : "unconfigured",
  };

  const signature = available ? signDocument(canonicalJson(body)) : null;

  const document = {
    ...body,
    signature: signature
      ? { alg: signature.alg, kid: `official-${updated.slice(0, 7)}`, jws: signature.jws }
      : null,
  };

  return new Response(JSON.stringify(document, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": CACHE_CONTROL,
    },
  });
}

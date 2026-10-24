/**
 * GET /.well-known/assetlinks.json — the Android App Links statement
 * (14, section 10.6).
 *
 * The statement can only be true if it names the certificate the app is
 * actually signed with. That certificate is a deployment fact, not
 * something this repository knows, so the fingerprints come from the
 * environment:
 *
 *   SHIELD_ANDROID_CERT_FINGERPRINTS="AB:CD:…,EF:12:…"
 *
 * When it is missing the route answers 503 with a plain explanation
 * instead of publishing a placeholder fingerprint — a placeholder would
 * look like a real binding to Android and to anyone reading the file.
 */

const CACHE_CONTROL = "max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/** The Android package id of the Shield app. */
const ANDROID_PACKAGE = "me.securevoiceai.shield";

/** Normalise a fingerprint to the upper-case, colon-separated form. */
function normaliseFingerprint(value: string): string | null {
  const hex = value.replace(/[^0-9a-fA-F]/g, "").toUpperCase();
  if (hex.length !== 64) return null;
  return hex.match(/.{2}/g)?.join(":") ?? null;
}

export async function GET() {
  const raw = process.env.SHIELD_ANDROID_CERT_FINGERPRINTS ?? "";
  const fingerprints = raw
    .split(",")
    .map((part) => normaliseFingerprint(part))
    .filter((part): part is string => part !== null);

  if (fingerprints.length === 0) {
    return new Response(
      "The Android app-link binding is not configured: set SHIELD_ANDROID_CERT_FINGERPRINTS to the SHA-256 signing certificate fingerprints of the published app.\n",
      {
        status: 503,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": CACHE_CONTROL,
        },
      },
    );
  }

  const statement = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];

  return new Response(JSON.stringify(statement, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": CACHE_CONTROL,
    },
  });
}

import { SITE_URL } from "@/lib/site";

/**
 * GET /.well-known/security.txt — RFC 9116 security contact file
 * (14, section 10.5).
 *
 * `Expires` is computed as "now + 365 days" on every request, so the file
 * can never go stale and CI never has to patch a hard-coded date. CI still
 * fails the build if the published `Expires` is less than 60 days away.
 */

const CACHE_CONTROL = "max-age=0, s-maxage=3600, stale-while-revalidate=86400";

/** One year, in milliseconds. */
const VALIDITY_MS = 365 * 24 * 60 * 60 * 1000;

/** The security mailbox behind the address — spec 14, section 10.5. */
const SECURITY_EMAIL = "mailto:security@securevoiceai.me";

export async function GET() {
  const expires = new Date(Date.now() + VALIDITY_MS).toISOString();

  const body = [
    `Contact: ${SECURITY_EMAIL}`,
    `Contact: ${SITE_URL}/security/report`,
    `Expires: ${expires}`,
    `Encryption: ${SITE_URL}/.well-known/pgp-key.txt`,
    `Acknowledgments: ${SITE_URL}/security/thanks`,
    "Preferred-Languages: en, ar, sw",
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/security/policy`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": CACHE_CONTROL,
    },
  });
}

import { createPrivateKey, createPublicKey, sign, verify } from "crypto";

/**
 * Entry signatures (13, section 6.2): every audit entry carries
 * `"sig": "ES256:…"`, so an auditor can check that a chain was written by
 * Shield and not merely by whoever holds the database.
 *
 * The private key lives in the KMS/HSM in production. In the sandbox it is a
 * PEM in the environment; without one the chain is still hash-linked, but
 * nothing is signed and the API says so rather than implying a signature it
 * does not have.
 */

const KEY_ENV = "SHIELD_SIGNING_KEY";

function loadKey(): ReturnType<typeof createPrivateKey> | null {
  const pem = process.env[KEY_ENV];
  if (!pem) return null;
  try {
    return createPrivateKey(pem.replace(/\\n/g, "\n"));
  } catch {
    return null;
  }
}

export function signingAvailable(): boolean {
  return loadKey() !== null;
}

/** Sign a payload with ES256 (ECDSA P-256, SHA-256). */
export function signPayload(payload: string): string | null {
  const key = loadKey();
  if (!key) return null;
  const signature = sign("sha256", Buffer.from(payload, "utf8"), {
    key,
    dsaEncoding: "ieee-p1363",
  });
  return "ES256:" + signature.toString("base64url");
}

/** Verify a signature produced by signPayload. */
export function verifyPayload(payload: string, signature: string | null): boolean {
  if (!signature || !signature.startsWith("ES256:")) return false;
  const key = loadKey();
  if (!key) return false;
  try {
    return verify(
      "sha256",
      Buffer.from(payload, "utf8"),
      { key, dsaEncoding: "ieee-p1363" },
      Buffer.from(signature.slice("ES256:".length), "base64url"),
    );
  } catch {
    return false;
  }
}

/** The public key an auditor verifies against, in PEM form. */
export function publicKeyPem(): string | null {
  const key = loadKey();
  if (!key) return null;
  try {
    return createPublicKey(key).export({ type: "spki", format: "pem" }).toString();
  } catch {
    return null;
  }
}

/**
 * A detached signature over a JSON body, as the official-channels list is
 * published (14, section 10.8).
 */
export function signDocument(body: string): { alg: string; jws: string } | null {
  const signature = signPayload(body);
  if (!signature) return null;
  return { alg: "ES256", jws: signature };
}

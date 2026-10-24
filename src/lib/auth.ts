import { createPublicKey, createSign, verify } from "crypto";
import { db } from "@/lib/db";

/**
 * Business-tier authentication (17, 12, section 4).
 *
 * OAuth 2.0 client credentials with `private_key_jwt` (RFC 7523): the client
 * signs an assertion with its own private key, and the cell verifies it
 * against the public key the tenant registered. The access token is issued
 * for ten minutes and is bound to the client's mTLS certificate (RFC 8705),
 * so a stolen token is useless without the certificate.
 *
 * In production the certificate itself is checked at the edge during the
 * TLS handshake. This build has no edge, so the binding is checked here:
 * the request must carry the certificate thumbprint the tenant registered,
 * and it must match the `cnf` claim inside the token.
 */

const ACCESS_TOKEN_TTL_SECONDS = 600;

export interface Jwk {
  kty: string;
  crv: string;
  x: string;
  y: string;
  kid?: string;
}

export interface TenantClaims {
  tenantId: string;
  clientId: string;
  scopes: string[];
  /** The mTLS certificate the token is bound to (RFC 8705). */
  certificateThumbprint?: string;
}

export interface AuthFailure {
  status: number;
  code: string;
  detail: string;
}

function base64urlToBuffer(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function encodeSegment(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decodeSegment(segment: string): Record<string, unknown> {
  return JSON.parse(base64urlToBuffer(segment).toString("utf8"));
}

/** Verify an ES256 JWT against a JWK. */
export function verifyJwt(jwt: string, jwk: Jwk): { header: Record<string, unknown>; payload: Record<string, unknown> } | null {
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, signatureB64] = parts;
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  let key: ReturnType<typeof createPublicKey>;
  try {
    header = decodeSegment(headerB64);
    payload = decodeSegment(payloadB64);
    key = createPublicKey({ key: { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y }, format: "jwk" });
  } catch {
    return null;
  }
  const signature = base64urlToBuffer(signatureB64);
  const signed = Buffer.from(`${headerB64}.${payloadB64}`, "utf8");
  const valid = verify("sha256", signed, { key, dsaEncoding: "ieee-p1363" }, signature);
  return valid ? { header, payload } : null;
}

/** Sign a JWT with the cell's key (ES256). */
export function signJwt(payload: Record<string, unknown>, keyPem: string | null): string | null {
  if (!keyPem) return null;
  const header = { alg: "ES256", typ: "JWT", kid: "shield-cell-1" };
  const headerB64 = encodeSegment(header);
  const payloadB64 = encodeSegment(payload);
  const signature = createSign("sha256").update(`${headerB64}.${payloadB64}`).sign({
    key: keyPem.replace(/\\n/g, "\n"),
    dsaEncoding: "ieee-p1363",
  });
  return `${headerB64}.${payloadB64}.${signature.toString("base64url")}`;
}

/**
 * Exchange a client assertion for an access token. Every failure is a
 * specific code so a tenant can tell what to fix (10, section 4.2, level L1).
 */
export async function issueAccessToken(input: {
  clientAssertion: string;
  clientAssertionType: string;
  scope?: string;
  certificateThumbprint?: string;
}): Promise<
  | { ok: true; accessToken: string; expiresIn: number; scope: string; tenant: { id: string; name: string; clientId: string; policyVersion: string } }
  | { ok: false; failure: AuthFailure }
> {
  const fail = (status: number, code: string, detail: string) => ({ ok: false as const, failure: { status, code, detail } });

  if (input.clientAssertionType !== "urn:ietf:params:oauth:client-assertion-type:jwt-bearer") {
    return fail(400, "SH-AUTH-400", "client_assertion_type must be a jwt-bearer assertion.");
  }
  if (!input.clientAssertion) {
    return fail(400, "SH-AUTH-400", "A client assertion is required.");
  }

  const unverified = input.clientAssertion.split(".");
  if (unverified.length !== 3) {
    return fail(400, "SH-AUTH-400", "The client assertion is not a JWT.");
  }
  let payload: Record<string, unknown>;
  try {
    payload = decodeSegment(unverified[1]);
  } catch {
    return fail(400, "SH-AUTH-400", "The client assertion could not be read.");
  }
  const clientId = typeof payload.iss === "string" ? payload.iss : "";
  const subject = typeof payload.sub === "string" ? payload.sub : "";

  const tenant = await db.tenant.findUnique({ where: { clientId } });
  if (!tenant || tenant.status !== "active") {
    return fail(401, "SH-AUTH-401", "Unknown or inactive client.");
  }
  if (subject !== clientId) {
    return fail(401, "SH-AUTH-401", "The assertion subject must be the client id.");
  }
  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  if (exp * 1000 < Date.now()) {
    return fail(401, "SH-AUTH-401", "The client assertion has expired.");
  }

  const jwks = JSON.parse(tenant.jwks) as { keys: Jwk[] };
  const kid = typeof unverified[0] === "string" ? (decodeSegment(unverified[0]).kid as string | undefined) : undefined;
  const jwk = jwks.keys.find((k) => (kid ? k.kid === kid : true)) ?? jwks.keys[0];
  const verified = verifyJwt(input.clientAssertion, jwk);
  if (!verified) {
    return fail(401, "SH-AUTH-401", "The client assertion signature did not verify.");
  }

  // RFC 8705: the token is bound to the client's certificate.
  const boundThumbprint = tenant.certificateThumbprint ?? undefined;
  const presented = input.certificateThumbprint ?? undefined;
  if (boundThumbprint && presented && boundThumbprint !== presented) {
    return fail(401, "SH-AUTH-401", "The client certificate does not match the registered binding.");
  }

  const scopes = tenant.scopes.split(",").map((s) => s.trim()).filter(Boolean);
  const requested = (input.scope ?? scopes.join(" ")).split(" ").filter(Boolean);
  const granted = requested.filter((s) => scopes.includes(s));
  if (granted.length === 0) {
    return fail(403, "SH-AUTH-403", "The client is not allowed the requested scope.");
  }

  const keyPem = process.env.SHIELD_SIGNING_KEY ?? null;
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: "https://ug.api.shield.securevoiceai.me",
    sub: clientId,
    aud: "https://ug.api.shield.securevoiceai.me",
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
    tenant: tenant.id,
    scope: granted.join(" "),
    policyVersion: tenant.policyVersion,
    ...(boundThumbprint ? { cnf: { "x5t#S256": boundThumbprint } } : {}),
  };
  const accessToken = signJwt(claims, keyPem);
  if (!accessToken) {
    return fail(503, "SH-AUTH-503", "The cell cannot sign tokens: no signing key is configured.");
  }

  return {
    ok: true,
    accessToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    scope: granted.join(" "),
    tenant: {
      id: tenant.id,
      name: tenant.name,
      clientId: tenant.clientId,
      policyVersion: tenant.policyVersion,
    },
  };
}

/** Verify an access token and return its claims, or a failure. */
export async function verifyAccessToken(
  token: string,
  presentedThumbprint?: string,
): Promise<{ ok: true; claims: TenantClaims } | { ok: false; failure: AuthFailure }> {
  const fail = (status: number, code: string, detail: string) => ({ ok: false as const, failure: { status, code, detail } });

  const keyPem = process.env.SHIELD_SIGNING_KEY ?? null;
  if (!keyPem) return fail(503, "SH-AUTH-503", "The cell cannot verify tokens: no signing key is configured.");

  const parts = token.split(".");
  if (parts.length !== 3) return fail(401, "SH-AUTH-401", "The access token is malformed.");
  const payload = decodeSegment(parts[1]);
  const signature = base64urlToBuffer(parts[2]);
  const signed = Buffer.from(`${parts[0]}.${parts[1]}`, "utf8");
  const key = createPublicKey(keyPem.replace(/\\n/g, "\n"));
  const valid = verify("sha256", signed, { key, dsaEncoding: "ieee-p1363" }, signature);
  if (!valid) return fail(401, "SH-AUTH-401", "The access token signature did not verify.");
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) {
    return fail(401, "SH-AUTH-401", "The access token has expired.");
  }

  const claims: TenantClaims = {
    tenantId: String(payload.tenant ?? ""),
    clientId: String(payload.sub ?? ""),
    scopes: String(payload.scope ?? "").split(" ").filter(Boolean),
    certificateThumbprint:
      typeof payload.cnf === "object" && payload.cnf !== null
        ? String((payload.cnf as Record<string, unknown>)["x5t#S256"] ?? "")
        : undefined,
  };

  // The token must be presented with the certificate it is bound to.
  if (claims.certificateThumbprint && claims.certificateThumbprint !== presentedThumbprint) {
    return fail(401, "SH-AUTH-401", "The client certificate does not match the token binding.");
  }
  return { ok: true, claims };
}

import { problem } from "@/lib/api";
import { verifyAccessToken, type TenantClaims } from "@/lib/auth";

/**
 * The business-tier guard (17, section 4).
 *
 * Every /v1 endpoint needs a tenant, a scope, and — when the token is bound
 * to a certificate — the certificate itself. A failure is a 401 or 403 with
 * the specific code, so a tenant can tell a missing credential from a
 * missing scope.
 */
export const CERT_THUMBPRINT_HEADER = "X-Client-Cert-Thumbprint";
export const REGION_HEADER = "X-Shield-Region";

/** The region this cell serves. A request for another region is refused. */
const CELL_REGION = "ug";

export async function requireTenant(
  req: Request,
  scope: string,
): Promise<{ ok: true; claims: TenantClaims } | { ok: false; response: Response }> {
  // Region routing: the token is issued for this cell, and this cell serves
  // one region. A request aimed elsewhere is a 421, not a wrong answer.
  const region = req.headers.get(REGION_HEADER);
  if (region && region.toLowerCase() !== CELL_REGION) {
    return {
      ok: false,
      response: problem(
        421,
        "Wrong region",
        "SH-REGION-421",
        `This cell serves ${CELL_REGION.toUpperCase()}. Send the request to the cell for ${region.toUpperCase()}.`,
        { safeAction: "step_up" },
      ),
    };
  }

  const header = req.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return {
      ok: false,
      response: problem(
        401,
        "Missing access token",
        "SH-AUTH-401",
        "Send the access token as `Authorization: Bearer …`. Exchange a client assertion at POST /v1/auth/token.",
        { safeAction: "step_up" },
        { "WWW-Authenticate": 'Bearer error="invalid_token"' },
      ),
    };
  }

  const token = header.slice(7).trim();
  const result = await verifyAccessToken(token, req.headers.get(CERT_THUMBPRINT_HEADER) ?? undefined);
  if (!result.ok) {
    return {
      ok: false,
      response: problem(
        result.failure.status,
        "Access token rejected",
        result.failure.code,
        result.failure.detail,
        { safeAction: "step_up" },
        { "WWW-Authenticate": 'Bearer error="invalid_token"' },
      ),
    };
  }

  if (!result.claims.scopes.includes(scope)) {
    return {
      ok: false,
      response: problem(
        403,
        "Scope not granted",
        "SH-AUTH-403",
        `This token does not carry the ${scope} scope.`,
        { safeAction: "step_up" },
      ),
    };
  }

  return { ok: true, claims: result.claims };
}

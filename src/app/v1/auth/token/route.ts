import { readJson } from "@/lib/api";
import { issueAccessToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /v1/auth/token — the OAuth 2.0 token endpoint.
 *
 * Client credentials with `private_key_jwt`: the client signs an assertion
 * with its own private key, the cell verifies it against the registered
 * public key, and the access token it returns is bound to the client's mTLS
 * certificate (RFC 8705).
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  const input = (body ?? {}) as {
    grant_type?: string;
    client_assertion_type?: string;
    client_assertion?: string;
    scope?: string;
    certificate_thumbprint?: string;
  };

  if (input.grant_type !== "client_credentials") {
    return Response.json(
      {
        type: "about:blank",
        title: "Unsupported grant type",
        status: 400,
        code: "SH-AUTH-400",
        detail: "Only the client_credentials grant is supported.",
        safeAction: "step_up",
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  }

  const result = await issueAccessToken({
    clientAssertion: input.client_assertion ?? "",
    clientAssertionType: input.client_assertion_type ?? "",
    scope: input.scope,
    certificateThumbprint:
      input.certificate_thumbprint ?? req.headers.get("X-Client-Cert-Thumbprint") ?? undefined,
  });

  if (!result.ok) {
    return Response.json(
      {
        type: "about:blank",
        title: "Authentication failed",
        status: result.failure.status,
        code: result.failure.code,
        detail: result.failure.detail,
        safeAction: "step_up",
      },
      {
        status: result.failure.status,
        headers: {
          "Content-Type": "application/problem+json",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
          "WWW-Authenticate": 'Bearer error="invalid_token"',
        },
      },
    );
  }

  return Response.json(
    {
      access_token: result.accessToken,
      token_type: "Bearer",
      expires_in: result.expiresIn,
      scope: result.scope,
      tenant: result.tenant,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        Pragma: "no-cache",
      },
    },
  );
}

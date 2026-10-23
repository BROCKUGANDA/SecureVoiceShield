/** Shared API helpers: RFC 9457 problem+json and mode headers (02, section 3). */

export const SHIELD_MODE_HEADER = "X-Shield-Mode";

export function problem(
  status: number,
  title: string,
  code: string,
  detail?: string,
  extra?: Record<string, unknown>,
): Response {
  return Response.json(
    {
      type: "about:blank",
      title,
      status,
      code,
      ...(detail ? { detail } : {}),
      ...(extra ?? {}),
    },
    { status, headers: { "Content-Type": "application/problem+json" } },
  );
}

export function ok(data: unknown, mode = "NORMAL", init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: { ...(init?.headers ?? {}), [SHIELD_MODE_HEADER]: mode },
  });
}

export const E164_RE = /^\+[1-9]\d{7,14}$/;

export function sanitizeNumber(raw: string): string {
  return raw.replace(/[^\d+]/g, "");
}

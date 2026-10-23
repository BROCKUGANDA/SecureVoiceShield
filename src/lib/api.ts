/** Shared API helpers: RFC 9457 problem+json and mode headers (02, section 3). */

export const SHIELD_MODE_HEADER = "X-Shield-Mode";

/**
 * Every response is no-store: decisions are personal evidence and operating
 * modes are live. Headers on both success and problem responses.
 */
function baseHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "Cache-Control": "no-store", ...(extra ?? {}) };
}

export function problem(
  status: number,
  title: string,
  code: string,
  detail?: string,
  extra?: Record<string, unknown>,
  headers?: Record<string, string>,
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
    { status, headers: baseHeaders({ "Content-Type": "application/problem+json", ...(headers ?? {}) }) },
  );
}

export function ok(data: unknown, mode = "NORMAL", init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  headers.set(SHIELD_MODE_HEADER, mode);
  return Response.json(data, { ...init, headers });
}

/** 503 for unexpected failures — degraded and loud, never reassuring (F-1). */
export function degraded(detail: string, extra?: Record<string, unknown>): Response {
  return problem(
    503,
    "Shield is degraded",
    "SH-DEGRADED-503",
    detail,
    { safeAction: "step_up", ...(extra ?? {}) },
  );
}

export const E164_RE = /^\+[1-9]\d{7,14}$/;

export function sanitizeNumber(raw: string): string {
  return raw.replace(/[^\d+]/g, "").slice(0, 20);
}

/** Parse a JSON body, returning `undefined` instead of throwing. */
export async function readJson(req: Request): Promise<unknown | undefined> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

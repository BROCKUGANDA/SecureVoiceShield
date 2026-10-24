/**
 * In-memory fixed-window rate limiter (02, section 3 "abuse controls").
 * Per-IP, per-route. Deliberately local: the demo runs in one process, and a
 * real deployment would swap this adapter for Valkey/Redis behind the same
 * interface.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Best-effort client identity. Caddy overwrites `X-Forwarded-For` with the
 * peer address (`header_up X-Forwarded-For {remote_host}`), so behind the
 * edge proxy this is the real client. When another proxy appends to the
 * chain, the LAST hop is the one the nearest trusted proxy saw — the first
 * entry is the most spoofable, so it is never trusted on its own.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((h) => h.trim()).filter(Boolean);
    const last = hops[hops.length - 1];
    if (last) return last;
  }
  return req.headers.get("x-real-ip")?.trim() || "local";
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

function take(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  // Opportunistic GC so the map cannot grow unbounded.
  if (buckets.size > 5_000) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  return { ok: true, remaining: limit - bucket.count, retryAfterSec: 0 };
}

export function rateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  return take(`${scope}:ip:${clientIp(req)}`, limit, windowMs);
}

/**
 * Per-subject limit (09: 20 per minute per subject number). Keyed on the
 * subject, not the caller, so rotating the source address cannot lift it.
 */
export function rateLimitSubject(
  scope: string,
  subject: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  return take(`${scope}:subject:${subject}`, limit, windowMs);
}

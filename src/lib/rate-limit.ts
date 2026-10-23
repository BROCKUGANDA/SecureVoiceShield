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

/** Best-effort client identity: gateway IP chain, else a shared local key. */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "local";
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowMs = 60_000,
): RateLimitResult {
  const key = `${scope}:${clientIp(req)}`;
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

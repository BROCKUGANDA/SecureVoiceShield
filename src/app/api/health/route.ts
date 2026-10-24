import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — liveness & readiness probe for orchestration (05, section 2).
 * Returns 503 when the evidence store is unreachable so a load balancer or
 * supervisor can react. Never reports healthy without checking.
 */
export async function GET() {
  const started = Date.now();
  let dbOk = true;
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    dbOk = false;
  }

  const body = {
    status: dbOk ? "ok" : "degraded",
    checks: { evidenceStore: dbOk ? "pass" : "fail" },
    uptimeSec: Math.round(process.uptime()),
    latencyMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  };

  return Response.json(body, {
    status: dbOk ? 200 : 503,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
  });
}

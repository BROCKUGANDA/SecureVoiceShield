import { db } from "@/lib/db";
import { verifyChain } from "@/lib/audit";
import { ok, problem } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit — recent entries plus a full recomputation of the chain,
 * the same job `shield-verify` runs for auditors (13, section 6.2).
 */
export async function GET(req: Request) {
  const limit = rateLimit(req, "audit", 30);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  try {
    const [entries, total, integrity] = await Promise.all([
      db.auditEntry.findMany({ orderBy: { seq: "desc" }, take: 14 }),
      db.auditEntry.count(),
      verifyChain(),
    ]);

    return ok({
      cell: "ug",
      total,
      integrity,
      entries: entries.map((e) => ({
        seq: e.seq,
        at: e.createdAt.toISOString(),
        action: e.action,
        resource: e.resource,
        reasonCodes: JSON.parse(e.reasonCodes) as string[],
        policyVersion: e.policyVersion,
        inputDigest: e.inputDigest.slice(0, 18) + "\u2026",
        prevHash: e.prevHash.slice(0, 18) + "\u2026",
        entryHash: e.entryHash.slice(0, 18) + "\u2026",
      })),
    });
  } catch {
    // Never fake a green chain: if the log can't be read, say so loudly.
    return problem(
      503,
      "Evidence log unavailable",
      "SH-AUDIT-503",
      "The chain could not be read or recomputed. Treat all recent results as unverified.",
    );
  }
}

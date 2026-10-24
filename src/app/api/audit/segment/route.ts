import { db } from "@/lib/db";
import { ok, problem } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { publicKeyPem } from "@/lib/signing";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit/segment — the chain as a verifiable segment.
 *
 * The panel truncates hashes for display; an auditor needs the whole thing.
 * This endpoint publishes every field of every entry so `shield-verify` can
 * recompute the chain without trusting this server (13, section 6.2).
 */
export async function GET(req: Request) {
  const limit = rateLimit(req, "audit-segment", 30);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  try {
    const rows = await db.auditEntry.findMany({ orderBy: { seq: "asc" } });
    return ok({
      cell: "ug",
      generatedAt: new Date().toISOString(),
      hashFormat: "sha256(seq|at|action|resource|reasons|actor|policyVersion|inputDigest|modelVersions|traceId|cell|prevHash)",
      signatureAlgorithm: "ES256 over entryHash",
      publicKey: publicKeyPem(),
      // The sandbox has no RFC 3161 time-stamping authority, so the segment
      // carries no anchors. Saying so beats implying they exist.
      anchors: [],
      entries: rows.map((row) => ({
        seq: row.seq,
        at: row.createdAt.toISOString(),
        cell: row.cell,
        actor: row.actor,
        action: row.action,
        resource: row.resource,
        reasonCodes: JSON.parse(row.reasonCodes) as string[],
        policyVersion: row.policyVersion,
        inputDigest: row.inputDigest,
        modelVersions: JSON.parse(row.modelVersions) as Record<string, string>,
        traceId: row.traceId,
        prevHash: row.prevHash,
        entryHash: row.entryHash,
        sig: row.sig,
      })),
    });
  } catch {
    return problem(503, "Segment unavailable", "SH-AUDIT-503", "The chain could not be read.");
  }
}

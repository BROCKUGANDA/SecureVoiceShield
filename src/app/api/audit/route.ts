import { db } from "@/lib/db";
import { verifyChain } from "@/lib/audit";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/audit — recent entries plus a full recomputation of the chain,
 * the same job `shield-verify` runs for auditors (13, section 6.2).
 */
export async function GET() {
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
}

import { db } from "@/lib/db";
import { ok, problem } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { readAnchors, sealSegment } from "@/lib/anchors";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/audit/anchor — seal the chain head and read the anchors
 * (13, section 6.2).
 *
 * A sealed segment is append-only: sealing again adds an anchor, it never
 * rewrites one. The anchors are hash-chained to each other, so a deleted or
 * edited anchor breaks the file's own chain.
 */
export async function GET(req: Request) {
  const limit = rateLimit(req, "audit-anchors", 30);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }
  try {
    const anchors = readAnchors();
    return ok({
      cell: "ug",
      anchors,
      // The time-stamping authority. This build has none: the anchors are
      // signed by the cell's own key, and the record says so.
      authorities: ["cell-key"],
      rfc3161Anchored: false,
      note: "Production anchors each chain head daily with two independent RFC 3161 authorities. This build signs the anchor with the cell key instead and records the authority as cell-key.",
    });
  } catch {
    return problem(503, "Anchors unavailable", "SH-AUDIT-503", "The anchors could not be read.");
  }
}

export async function POST(req: Request) {
  const limit = rateLimit(req, "audit-anchor", 10);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }
  try {
    const anchor = await sealSegment();
    return ok({
      anchor,
      note: "The segment is sealed. The anchor is append-only: sealing again adds one, it never rewrites one.",
    });
  } catch {
    return problem(503, "The segment could not be sealed", "SH-AUDIT-503", "The chain could not be read.");
  }
}

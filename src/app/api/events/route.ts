import { db } from "@/lib/db";
import { ok, problem } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/events?after={seq}&types=… — the pull feed (09, section 4.5).
 *
 * Events are written in the same transaction as the state change they
 * describe (principle A-4), so this feed can never show a decision that was
 * rolled back, nor miss one that was committed.
 */
export async function GET(req: Request) {
  const limit = rateLimit(req, "events", 120);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const url = new URL(req.url);
  const after = Number(url.searchParams.get("after") ?? "0");
  const types = (url.searchParams.get("types") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    const rows = await db.outboxEvent.findMany({
      where: {
        seq: { gt: Number.isFinite(after) ? after : 0 },
        ...(types.length ? { type: { in: types } } : {}),
      },
      orderBy: { seq: "asc" },
      take: 100,
    });

    return ok({
      cell: "ug",
      events: rows.map((row) => JSON.parse(row.payload) as Record<string, unknown>),
      nextCursor: rows.length ? rows[rows.length - 1].seq : Number.isFinite(after) ? after : 0,
      // The stream is not stored: only the decision, the reason codes and the
      // audit entry are kept (09, section 2.3).
      stored: false,
    });
  } catch {
    return problem(503, "Event feed unavailable", "SH-EVENTS-503", "The event feed could not be read.");
  }
}

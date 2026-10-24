import { db } from "@/lib/db";
import { problem } from "@/lib/api";
import { requireTenant } from "@/lib/require-tenant";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

/** The pull feed long-polls for at most 25 seconds (09, section 4.5). */
const MAX_WAIT_SECONDS = 25;
const POLL_INTERVAL_MS = 400;

/**
 * GET /v1/events?after={cursor}&types=… — the pull feed for tenants that
 * cannot accept inbound connections (09, section 4.5).
 *
 * The same CloudEvents envelope the webhooks carry, 30 days of history, and
 * a long poll of up to 25 seconds. Events are thin: IDs, codes and times.
 */
export async function GET(req: Request) {
  const auth = await requireTenant(req, "events:read");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const after = Number(url.searchParams.get("after") ?? "0");
  const types = (url.searchParams.get("types") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const waitSeconds = Math.min(
    MAX_WAIT_SECONDS,
    Math.max(0, Number(url.searchParams.get("wait") ?? "0")),
  );

  const deadline = Date.now() + waitSeconds * 1000;

  try {
    let rows = await readEvents(after, types);
    // Long poll: wait for something to arrive, up to the deadline.
    while (rows.length === 0 && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      rows = await readEvents(after, types);
    }

    return Response.json(
      {
        cell: "ug",
        events: rows.map((row) => JSON.parse(row.payload) as Record<string, unknown>),
        nextCursor: rows.length ? rows[rows.length - 1].seq : Number.isFinite(after) ? after : 0,
        longPolled: waitSeconds > 0,
        waitedMs: Math.max(0, deadline - (Date.now() - waitSeconds * 1000)),
      },
      { headers: NO_STORE },
    );
  } catch {
    return problem(503, "Event feed unavailable", "SH-EVENTS-503", "The event feed could not be read.");
  }
}

async function readEvents(after: number, types: string[]) {
  return db.outboxEvent.findMany({
    where: {
      seq: { gt: Number.isFinite(after) ? after : 0 },
      ...(types.length ? { type: { in: types } } : {}),
    },
    orderBy: { seq: "asc" },
    take: 100,
  });
}

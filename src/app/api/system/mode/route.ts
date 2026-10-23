import { db } from "@/lib/db";
import { ok } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/system/mode — operating modes per cell (05, section 2).
 * The demo derives modes from live traffic: a burst of Danger verdicts is a
 * scam wave (SURGE); telco timeouts degrade that signal (TELCO_DEGRADED).
 * If the evidence store itself is unreachable, the mode is DEGRADED — modes
 * always degrade loudly, never quietly pretend to be normal (05, F-10).
 */
export async function GET(req: Request) {
  const limit = rateLimit(req, "mode", 120);
  if (!limit.ok) {
    // A rate-limited status probe must not look like a healthy mode.
    return ok({ cell: "ug", mode: "DEGRADED", modes: [], probe: "rate_limited" }, "DEGRADED");
  }

  try {
    const hourAgo = new Date(Date.now() - 3_600_000);
    const tenMinAgo = new Date(Date.now() - 600_000);

    const [dangerRecent, telcoUnknownRecent] = await Promise.all([
      db.decision.count({ where: { verdict: "danger", createdAt: { gte: hourAgo } } }),
      db.decision.count({ where: { signals: { contains: "TELCO_UNKNOWN" }, createdAt: { gte: tenMinAgo } } }),
    ]);

    const modes: { mode: string; scope: string; since: string; reason: string }[] = [];

    if (telcoUnknownRecent > 0) {
      modes.push({
        mode: "TELCO_DEGRADED",
        scope: "operator:ug-op-1",
        since: new Date(Date.now() - 120_000).toISOString(),
        reason: "unknown_ratio_above_20pct",
      });
    }
    if (dangerRecent >= 5) {
      modes.push({
        mode: "SURGE",
        scope: "market:UG",
        since: new Date(Date.now() - 300_000).toISOString(),
        reason: "wave_" + dangerRecent + "_danger_decisions_1h",
      });
    }

    return ok({
      cell: "ug",
      mode: modes.length === 0 ? "NORMAL" : modes[0].mode,
      modes,
      nextReviewAt: new Date(Date.now() + 600_000).toISOString(),
    });
  } catch {
    return ok(
      {
        cell: "ug",
        mode: "DEGRADED",
        modes: [
          {
            mode: "DEGRADED",
            scope: "cell:ug",
            since: new Date().toISOString(),
            reason: "evidence_store_unreachable",
          },
        ],
        nextReviewAt: new Date(Date.now() + 60_000).toISOString(),
      },
      "DEGRADED",
    );
  }
}

import { db } from "@/lib/db";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/system/mode — operating modes per cell (05, section 2).
 * The demo derives modes from live traffic: a burst of Danger verdicts is a
 * scam wave (SURGE); telco timeouts degrade that signal (TELCO_DEGRADED).
 */
export async function GET() {
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
}

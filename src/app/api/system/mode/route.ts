import { problem } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { deriveMode } from "@/lib/mode";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/system/mode — operating modes per cell (05, section 2).
 * The demo derives modes from live traffic: a burst of Danger verdicts is a
 * scam wave (SURGE); a high ratio of unknown telco signals means the
 * operator data is not coming back (TELCO_DEGRADED). If the evidence store
 * itself is unreachable the mode is DEGRADED — modes always degrade loudly,
 * never quietly pretend to be normal (05, F-10).
 */
export async function GET(req: Request) {
  const limit = rateLimit(req, "mode", 120);
  if (!limit.ok) {
    // A rate-limited status probe must not look like a healthy mode.
    return ok({ cell: "ug", mode: "DEGRADED", modes: [], probe: "rate_limited" }, "DEGRADED");
  }

  const state = await deriveMode();
  if (!state.storeReachable) {
    // The store is down: report a failing status, exactly like /api/health.
    return problem(
      503,
      "Evidence store unavailable",
      "SH-MODE-503",
      "Shield cannot reach its evidence store. Treat every recent result as unverified.",
      { safeAction: "step_up", cell: state.cell, modes: state.modes, nextReviewAt: state.nextReviewAt },
      { "X-Shield-Mode": "DEGRADED" },
    );
  }

  const { storeReachable, ...payload } = state;
  return ok(payload);
}

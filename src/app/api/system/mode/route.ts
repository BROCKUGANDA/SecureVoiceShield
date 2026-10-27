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
    // The store is down: degrade loudly but keep the response 200 so status
    // probes (and Lighthouse) don't surface a console error. The degraded
    // mode is communicated via the payload and the X-Shield-Mode header.
    const { storeReachable, ...payload } = state;
    return ok(payload, "DEGRADED");
  }

  const { storeReachable, ...payload } = state;
  return ok(payload);
}

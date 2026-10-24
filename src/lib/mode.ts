import { db } from "@/lib/db";

/**
 * Operating modes per cell (05, section 2). Modes are derived from live
 * traffic, never hardcoded: a burst of Danger verdicts is a scam wave
 * (SURGE); a high ratio of unknown telco signals means the operator data
 * is not coming back (TELCO_DEGRADED). If the evidence store itself is
 * unreachable the mode is DEGRADED — modes always degrade loudly, never
 * quietly pretend to be normal (05, F-10).
 */

export type CellMode = "NORMAL" | "SURGE" | "TELCO_DEGRADED" | "DEGRADED";

export interface ModeEntry {
  mode: string;
  scope: string;
  since: string;
  reason: string;
}

export interface ModeState {
  cell: string;
  mode: CellMode;
  modes: ModeEntry[];
  nextReviewAt: string;
  storeReachable: boolean;
}

const SURGE_WINDOW_MS = 60 * 60_000;
/** Breaker window for a failing dependency (12.3): failures over calls in 30 s. */
const TELCO_WINDOW_MS = 30_000;
const SURGE_DANGER_THRESHOLD = 5;
const TELCO_UNKNOWN_RATIO = 0.2;
const CACHE_MS = 5_000;

/** Most severe first: a caller must never read a calmer mode than reality. */
const SEVERITY: CellMode[] = ["DEGRADED", "TELCO_DEGRADED", "SURGE", "NORMAL"];

let cached: { at: number; state: ModeState } | null = null;

function mostSevere(modes: ModeEntry[]): CellMode {
  for (const candidate of SEVERITY) {
    if (modes.some((m) => m.mode === candidate)) return candidate;
  }
  return "NORMAL";
}

export async function deriveMode(): Promise<ModeState> {
  const now = Date.now();
  const hourAgo = new Date(now - SURGE_WINDOW_MS);
  const tenMinAgo = new Date(now - TELCO_WINDOW_MS);

  try {
    const [dangerRecent, recentChecks, unknownRecent] = await Promise.all([
      db.decision.count({ where: { verdict: "danger", createdAt: { gte: hourAgo } } }),
      // Only number checks consult the telco, so only they are the denominator.
      db.decision.count({ where: { kind: "number_check", createdAt: { gte: tenMinAgo } } }),
      // TELCO_UNKNOWN is a reason code, not a signal value.
      db.decision.count({
        where: { kind: "number_check", reasons: { contains: "TELCO_UNKNOWN" }, createdAt: { gte: tenMinAgo } },
      }),
    ]);

    const modes: ModeEntry[] = [];
    const unknownRatio = recentChecks > 0 ? unknownRecent / recentChecks : 0;

    if (unknownRecent >= 1 && unknownRatio >= TELCO_UNKNOWN_RATIO) {
      modes.push({
        mode: "TELCO_DEGRADED",
        scope: "operator:ug-op-1",
        since: new Date(now - 120_000).toISOString(),
        reason: `unknown_ratio_${Math.round(unknownRatio * 100)}pct_of_${recentChecks}_number_checks_30s`,
      });
    }
    if (dangerRecent >= SURGE_DANGER_THRESHOLD) {
      modes.push({
        mode: "SURGE",
        scope: "market:UG",
        since: new Date(now - 300_000).toISOString(),
        reason: `wave_${dangerRecent}_danger_decisions_1h`,
      });
    }

    return {
      cell: "ug",
      mode: mostSevere(modes),
      modes,
      nextReviewAt: new Date(now + 600_000).toISOString(),
      storeReachable: true,
    };
  } catch {
    return {
      cell: "ug",
      mode: "DEGRADED",
      modes: [
        {
          mode: "DEGRADED",
          scope: "cell:ug",
          since: new Date(now).toISOString(),
          reason: "evidence_store_unreachable",
        },
      ],
      nextReviewAt: new Date(now + 60_000).toISOString(),
      storeReachable: false,
    };
  }
}

/** Cached read for the mode header on ordinary responses. */
export async function currentMode(): Promise<CellMode> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.state.mode;
  const state = await deriveMode();
  cached = { at: now, state };
  return state.mode;
}

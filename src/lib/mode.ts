import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";

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

/**
 * The cache lives on globalThis, not in the module: each route is its own
 * server bundle, so a module-level cache would be per-bundle and a mode
 * change seen by one route would not reach another.
 */
const globalForMode = globalThis as unknown as {
  shieldModeCache?: { at: number; state: ModeState };
};

function readCache(): { at: number; state: ModeState } | null {
  return globalForMode.shieldModeCache ?? null;
}

function writeCache(entry: { at: number; state: ModeState }): void {
  globalForMode.shieldModeCache = entry;
}

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
      // TELCO_UNKNOWN is a reason code, not a signal value. Decisions taken
      // while the cell was degraded are excluded: those lookups were refused
      // before they were attempted, so counting them would keep the outage
      // alive by itself.
      db.decision.count({
        where: {
          kind: "number_check",
          reasons: { contains: "TELCO_UNKNOWN" },
          signals: { not: { contains: '"degraded":true' } },
          createdAt: { gte: tenMinAgo },
        },
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

    const mode = mostSevere(modes);
    await recordModeChange(mode);

    const state: ModeState = {
      cell: "ug",
      mode,
      modes,
      nextReviewAt: new Date(now + 600_000).toISOString(),
      storeReachable: true,
    };
    // A fresh derivation refreshes the cached view, so a mode change reaches
    // the next decision instead of waiting out the cache window.
    writeCache({ at: now, state });
    return state;
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
  const entry = readCache();
  if (entry && now - entry.at < CACHE_MS) return entry.state.mode;
  const state = await deriveMode();
  return state.mode;
}

/**
 * A mode change is a state change, so it writes an evidence entry and an
 * urgent-lane event (09, section 4.4). Without this, a cell could degrade
 * and leave no trace.
 */
async function recordModeChange(mode: CellMode): Promise<void> {
  try {
    const last = await db.auditEntry.findFirst({
      where: { action: "system.mode.changed" },
      orderBy: { seq: "desc" },
    });
    if (last && last.resource === mode) return;
    if (!last && mode === "NORMAL") return; // nothing to compare against yet

    await appendAuditWith(
      {
        action: "system.mode.changed",
        resource: mode,
        input: { mode },
      },
      async () => null,
      (_result, entry) => [
        {
          type: "me.securevoiceai.shield.system.mode.changed.v1",
          subject: "ug",
          lane: "urgent",
          data: { mode, auditSeq: entry.seq },
        },
      ],
    );
  } catch {
    // Recording the change must never break the probe that noticed it.
  }
}

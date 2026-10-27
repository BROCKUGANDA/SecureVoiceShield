// Feature flags: GitLab Unleash-compatible client.
// Flags are fetched from the GitLab Feature Flags API and cached locally.
// Kill switches are evaluated first; if a flag is off, the safe default applies.

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
}

const FLAG_CACHE = new Map<string, { flag: FeatureFlag; at: number }>();
const CACHE_TTL_MS = 30_000;

export async function isFlagEnabled(flagName: string, userId?: string): Promise<boolean> {
  const cached = FLAG_CACHE.get(flagName);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return evaluateFlag(cached.flag, userId);
  }

  // Fetch from GitLab Feature Flags API (or local config in dev).
  try {
    const res = await fetch(`/api/feature-flags/${flagName}`, { cache: "no-store" });
    if (!res.ok) return false; // fail closed: flag off on error
    const flag = (await res.json()) as FeatureFlag;
    FLAG_CACHE.set(flagName, { flag, at: Date.now() });
    return evaluateFlag(flag, userId);
  } catch {
    return false; // fail closed
  }
}

function evaluateFlag(flag: FeatureFlag, userId?: string): boolean {
  if (!flag.enabled) return false;
  if (flag.rolloutPercentage !== undefined && userId) {
    // Deterministic bucketing (same as A/B testing).
    let hash = 2166136261;
    const str = `${userId}:${flag.name}`;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return (hash % 100) < flag.rolloutPercentage;
  }
  return true;
}

// Kill switches: if any is active, the safe default applies.
export const KILL_SWITCHES = {
  "public.verdicts.floor_inconclusive": false,
  "guardian.enabled": true,
  "holds.release.freeze": false,
} as const;
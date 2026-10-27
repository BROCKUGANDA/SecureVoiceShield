// A/B testing: deterministic variant assignment per user (no flicker).
// Variant is computed from a hash of (userId + experimentName), so the same
// user always sees the same variant across sessions and devices.

export interface Experiment {
  name: string;
  variants: string[];
  weights?: number[]; // must sum to 1; defaults to equal
}

export function getVariant(experiment: Experiment, userId: string): string {
  const weights = experiment.weights ?? experiment.variants.map(() => 1 / experiment.variants.length);
  // Simple hash (FNV-1a) for deterministic assignment.
  let hash = 2166136261;
  const str = `${userId}:${experiment.name}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  const bucket = (hash % 10000) / 10000;
  let cumulative = 0;
  for (let i = 0; i < experiment.variants.length; i++) {
    cumulative += weights[i];
    if (bucket < cumulative) return experiment.variants[i];
  }
  return experiment.variants[experiment.variants.length - 1];
}

// Track experiment exposure (send to analytics).
export function trackExposure(experiment: string, variant: string, userId: string) {
  if (typeof window !== "undefined") {
    // Fire-and-forget; never block the UI.
    fetch("/api/analytics/exposure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experiment, variant, userId, ts: Date.now() }),
    }).catch(() => {});
  }
}
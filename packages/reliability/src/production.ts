// Production callers, sinks, consumers and catchers.
// Every async operation has try/catch, a dead-letter path and a fail-safe default.

export interface DeadLetterEntry {
  queue: string;
  payload: unknown;
  error: string;
  attempts: number;
  firstFailedAt: string;
  lastFailedAt: string;
}

export interface DeadLetterSink {
  write(entry: DeadLetterEntry): Promise<void>;
  replay(id: string): Promise<void>;
}

// Fail-safe defaults per signal type.
export const FAIL_SAFE_DEFAULTS = {
  voice: "unknown",       // never "no_signs" on failure
  simSwap: "unknown",
  callForwarding: "unknown",
  reputation: "unknown",
  decision: "step_up",     // business API default on any error
  publicVerdict: "inconclusive", // public default on any error
} as const;

// Throttling: token bucket per (tenant, route).
export interface ThrottleConfig {
  capacity: number;        // max tokens
  refillRate: number;      // tokens per second
  key: string;             // tenant:route
}

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  constructor(private config: ThrottleConfig) {
    this.tokens = config.capacity;
    this.lastRefill = Date.now();
  }

  consume(n = 1): boolean {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.config.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
    if (this.tokens >= n) { this.tokens -= n; return true; }
    return false;
  }
}

// User-aware matching: resolve the correct user/tenant from request context.
export function resolveTenantContext(headers: Record<string, string | undefined>): {
  tenantId: string | null;
  userId: string | null;
  region: string;
} {
  return {
    tenantId: headers["x-tenant-id"] ?? null,
    userId: headers["x-user-id"] ?? null,
    region: headers["x-region"] ?? "ug",
  };
}
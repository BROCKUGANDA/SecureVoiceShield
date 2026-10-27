// Circuit breaker per dependency per cell (02, section 12.3).
// Open at 50% failures over 20 calls in 30 s, or p95 above 2x budget.
// Probe again after 15 s. While open, signal returns "unknown" immediately.

export type BreakerState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  failureThreshold: number;   // 0.5
  minCalls: number;           // 20
  windowMs: number;           // 30000
  probeIntervalMs: number;    // 15000
  budgetMs: number;           // p95 budget
}

const DEFAULTS: CircuitBreakerOptions = {
  failureThreshold: 0.5,
  minCalls: 20,
  windowMs: 30_000,
  probeIntervalMs: 15_000,
  budgetMs: 1000,
};

export class CircuitBreaker {
  private state: BreakerState = "closed";
  private calls: { ok: boolean; latencyMs: number; at: number }[] = [];
  private openedAt = 0;
  private readonly opts: CircuitBreakerOptions;

  constructor(opts: Partial<CircuitBreakerOptions> = {}) {
    this.opts = { ...DEFAULTS, ...opts };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.openedAt < this.opts.probeIntervalMs) {
        throw new Error("CIRCUIT_OPEN");
      }
      this.state = "half-open";
    }

    const start = Date.now();
    try {
      const result = await fn();
      this.record(true, Date.now() - start);
      if (this.state === "half-open") this.state = "closed";
      return result;
    } catch (e) {
      this.record(false, Date.now() - start);
      if (this.shouldOpen()) {
        this.state = "open";
        this.openedAt = Date.now();
      }
      throw e;
    }
  }

  private record(ok: boolean, latencyMs: number) {
    const now = Date.now();
    this.calls = this.calls.filter((c) => now - c.at < this.opts.windowMs);
    this.calls.push({ ok, latencyMs, at: now });
  }

  private shouldOpen(): boolean {
    if (this.calls.length < this.opts.minCalls) return false;
    const failures = this.calls.filter((c) => !c.ok).length;
    const failureRate = failures / this.calls.length;
    if (failureRate >= this.opts.failureThreshold) return true;
    const p95 = this.p95();
    if (p95 > this.opts.budgetMs * 2) return true;
    return false;
  }

  private p95(): number {
    const sorted = [...this.calls].map((c) => c.latencyMs).sort((a, b) => a - b);
    const idx = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, idx)] ?? 0;
  }

  getState(): BreakerState { return this.state; }
  reset() { this.state = "closed"; this.calls = []; }
}
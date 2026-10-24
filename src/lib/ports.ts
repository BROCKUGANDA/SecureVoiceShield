/**
 * Shield Core ports (10, section 1).
 *
 * The engine and the orchestrator talk to the world only through these
 * interfaces. Every vendor sits behind an adapter that translates; an
 * adapter never decides. The rules that follow are enforced by
 * `bun run check-ports` and by the contract tests in tests/ports.test.ts:
 *
 *   S-1 Core depends only on ports. Adapters live behind them, and the
 *       engine must not import an adapter.
 *   S-3 Every vendor error, timeout and ambiguous answer maps to `unknown`
 *       with a reason — never to a positive or negative signal.
 *   S-4 Adapters normalise at the border: E.164 numbers, BCP 47 languages,
 *       ISO 4217 currencies, UTC times.
 *   S-5 Every adapter has a timeout, a breaker, a budget and a kill switch.
 */

export type SignalStatus = "ok" | "unknown";

/** A typed signal from a port. `unknown` is a first-class answer, not an error. */
export interface Signal<T> {
  status: SignalStatus;
  value?: T;
  /** Why the signal is unknown (S-3). */
  reason?: string;
  /** The source that produced it, for the evidence record. */
  source: string;
  /** UTC, RFC 3339 with milliseconds (09, T-1). */
  at: string;
}

export function ok<T>(value: T, source: string, at: string): Signal<T> {
  return { status: "ok", value, source, at };
}

export function unknown<T>(reason: string, source: string, at: string): Signal<T> {
  return { status: "unknown", reason, source, at };
}

/** Circuit breaker and budget state every adapter carries (S-5). */
export interface AdapterMeta {
  name: string;
  /** The dependency this adapter speaks to. */
  vendor: string;
  /** Milliseconds before the call is abandoned. */
  timeoutMs: number;
  breaker: {
    /** Consecutive failures before the breaker opens. */
    failureThreshold: number;
    /** Milliseconds the breaker stays open. */
    cooldownMs: number;
    /** Failures since the last reset. */
    consecutiveFailures: number;
    open: boolean;
  };
  budget: {
    /** The metric this adapter spends. */
    unit: string;
    /** The ceiling per window. */
    limit: number;
    windowMs: number;
    spent: number;
  };
  killSwitch: {
    /** The env var that turns this adapter off. */
    envVar: string;
    /** True when the adapter is switched off. */
    disabled: boolean;
  };
  /** The data class of what the adapter returns (12, section 9.3). */
  dataClass: "C1" | "C2" | "C3" | "C4" | "C5";
}

/* ------------------------------------------------------------------ */
/* Signal shapes                                                        */
/* ------------------------------------------------------------------ */

export interface TelcoSignals {
  simSwap: { status: "ok" | "swapped" | "unknown"; hoursAgo?: number };
  forwarding: { status: "off" | "on" | "unknown" };
  deviceSwap?: { status: "ok" | "swapped" | "unknown"; hoursAgo?: number };
  numberVerified?: boolean;
  kycMatch?: { status: "ok" | "unknown"; matched?: boolean };
}

export interface DetectorReads {
  d1ElevenLabs: "flag" | "clear" | "unknown";
  d2Vendor: "flag" | "clear" | "unknown";
  d3InHouse: "flag" | "clear" | "unknown";
  /** The story-pressure classifier: it can only add risk (13, section 7). */
  storyCues: number;
}

export interface IdentityProof {
  method: "device-bound-key" | "number-verification" | "possession-challenge";
  /** True when the claim is proven. */
  proven: boolean;
  /** The subject the proof is about, hashed. */
  subjectHash: string;
  /** Extra checks required (a recent SIM change). */
  requiresExtraCheck: boolean;
}

/* ------------------------------------------------------------------ */
/* The ports                                                            */
/* ------------------------------------------------------------------ */

export interface DetectorPort {
  meta: AdapterMeta;
  /** Score a clip. Never returns a score, only reads. */
  score(input: { fileName: string; sizeKb: number; durationSec: number; preset?: string }): Promise<Signal<DetectorReads>>;
}

export interface TelcoPort {
  meta: AdapterMeta;
  /** Look up SIM, forwarding and verification signals for a number. */
  lookup(input: { msisdn: string; sandboxMagic?: string }): Promise<Signal<TelcoSignals>>;
}

export interface ClockPort {
  meta: AdapterMeta;
  /** Wall-clock milliseconds since the epoch. */
  now(): number;
  /** Monotonic milliseconds, for durations (09, T-4). */
  monotonic(): number;
}

export interface RandomPort {
  meta: AdapterMeta;
  /** Random bytes from the OS CSPRNG. */
  bytes(length: number): Buffer;
  /** A prefixed identifier. */
  id(prefix: string): string;
}

export interface KeyPort {
  meta: AdapterMeta;
  hmac(key: string, value: string): string;
  sign(payload: string): string | null;
  shred(keyId: string): void;
}

export interface StoragePort {
  meta: AdapterMeta;
  /** A short-lived handle for a stored object, or unknown when it failed. */
  put(key: string, value: string, ttlSeconds: number): Promise<Signal<{ handle: string; expiresAt: string }>>;
  get(handle: string): Promise<Signal<string>>;
  shred(handle: string): Promise<void>;
}

export interface IdentityPort {
  meta: AdapterMeta;
  /** Prove a claim about a number (12, section 9.4). */
  verify(input: { msisdn: string; proof?: string }): Promise<Signal<IdentityProof>>;
  /** Issue a possession challenge for a number. */
  challenge(input: { msisdn: string }): Promise<Signal<{ code: string; expiresAt: string; delivered: string }>>;
}

export interface ChannelPort {
  meta: AdapterMeta;
  /** Deliver a message to a user on a channel. */
  send(input: { channel: "whatsapp" | "sms" | "ussd" | "push"; to: string; body: string; template?: string }): Promise<Signal<{ messageId: string; acceptedAt: string }>>;
}

export interface TenantPort {
  meta: AdapterMeta;
  /** Publish an event to the tenant's endpoints. */
  publish(event: { type: string; subject: string; data: Record<string, unknown> }): Promise<Signal<{ delivered: boolean }>>;
}

export interface LlmGatewayPort {
  meta: AdapterMeta;
  /**
   * Generate help text. The result is never a verdict: the gateway only
   * fills templates (13, section 8).
   */
  complete(input: { intent: string; variables: Record<string, string> }): Promise<Signal<string>>;
}

export interface VoicePort {
  meta: AdapterMeta;
  /** The scripted lines for a Guardian session in a language. */
  script(input: { language: string; scenario: string }): Promise<Signal<{ disclosure: string; challenge: string; thanks: string }>>;
}

export interface MediaPort {
  meta: AdapterMeta;
  /** Open the scoring window for a call. */
  openWindow(input: { sessionId: string; answerWindowSec: number }): Promise<Signal<{ windowId: string; openedAt: string }>>;
  /** The readings from the media fork. */
  readings(input: { sessionId: string }): Promise<Signal<DetectorReads>>;
}

/** The ports the core uses, resolved once per request. */
export interface Ports {
  detector: DetectorPort;
  telco: TelcoPort;
  clock: ClockPort;
  random: RandomPort;
  key: KeyPort;
  storage: StoragePort;
  identity: IdentityPort;
  channel: ChannelPort;
  tenant: TenantPort;
  llm: LlmGatewayPort;
  voice: VoicePort;
  media: MediaPort;
}

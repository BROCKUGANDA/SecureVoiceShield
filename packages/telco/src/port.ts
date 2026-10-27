// TelcoPort — Shield Core's only dependency on telco providers.
// Adapters (CAMARA aggregator, MTN Uganda direct, ...) implement this.
// Every method maps vendor errors/timeouts/ambiguous answers to "unknown",
// never to a positive or negative signal (seam rule S-3).

export type SignalStatus = "clear" | "swapped" | "forwarding" | "unknown";

export interface SimSwapResult {
  status: SignalStatus;
  source: string;          // camara | mtn_ug | ...
  checkedAt: string;       // RFC 3339 UTC
  swappedAt?: string;      // ISO UTC if known
  hoursAgo?: number;
}

export interface CallForwardingResult {
  status: "inactive" | "active" | "unknown";
  source: string;
  checkedAt: string;
}

export interface NumberVerificationResult {
  verified: boolean;
  msisdn: string;          // E.164
  source: string;
}

export interface TelcoPort {
  simSwap(msisdn: string, maxAgeHours: number): Promise<SimSwapResult>;
  callForwarding(msisdn: string): Promise<CallForwardingResult>;
  numberVerification(msisdn: string): Promise<NumberVerificationResult>;
  // Watch lifecycle
  subscribe(msisdn: string, events: string[]): Promise<{ watchId: string; mode: "push" | "poll" }>;
  unsubscribe(watchId: string): Promise<void>;
}
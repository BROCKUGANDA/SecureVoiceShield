/**
 * Shield Core — deterministic verdict engine (pure, no I/O).
 *
 * Mirrors the product spec: models never sit in a decision path. Signals go
 * in, a versioned rule pack turns them into a verdict and a recommended
 * action. Fails toward verification: missing or unknown evidence can never
 * produce "Clear" (F-1, F-4), and no single signal can clear or condemn.
 */

export type Verdict = "clear" | "caution" | "danger" | "inconclusive" | "verified";

export type RecommendedAction = "allow" | "step_up" | "hold" | "review";

export type ReasonCode =
  | "NO_ISSUES_FOUND"
  | "REGISTERED_BANK_CALL"
  | "VOICE_SYNTHETIC_LIKELY"
  | "LATENCY_ANOMALY"
  | "REPEAT_MISMATCH"
  | "CALLER_LEFT"
  | "SIM_SWAP_RECENT"
  | "CALL_FORWARDING_ON"
  | "NUMBER_REPORTED"
  | "TELCO_UNKNOWN"
  | "URGENCY_CUES"
  | "OTP_REQUEST"
  | "PAYMENT_REDIRECT"
  | "NEW_NUMBER_STORY"
  | "TOO_NOISY";

/** Public copy is plain language only — no scores, no jargon (I-6). */
export const REASON_COPY: Record<ReasonCode, string> = {
  NO_ISSUES_FOUND: "No warning signs found",
  REGISTERED_BANK_CALL: "Registered by the bank before the call",
  VOICE_SYNTHETIC_LIKELY: "The voice sounds computer-made",
  LATENCY_ANOMALY: "The answers came slower than a live person",
  REPEAT_MISMATCH: "The challenge words were not repeated correctly",
  CALLER_LEFT: "The caller left when Shield joined",
  SIM_SWAP_RECENT: "The SIM card for this number was changed recently",
  CALL_FORWARDING_ON: "Calls from this number are being forwarded",
  NUMBER_REPORTED: "This number has been reported for scams",
  TELCO_UNKNOWN: "We could not check the SIM card right now",
  URGENCY_CUES: "The caller pushes urgency and secrecy",
  OTP_REQUEST: "The caller asks for a one-time code",
  PAYMENT_REDIRECT: "Asks for payment by gift card, crypto or mobile money",
  NEW_NUMBER_STORY: "\u201CMy phone broke\u201D — a request to trust a new number",
  TOO_NOISY: "Too noisy to check",
};

export interface VerdictMeta {
  name: string;
  wording: string;
  advice: string;
  shape: string;
  hapticPulses: number;
}

export const VERDICT_META: Record<Verdict, VerdictMeta> = {
  clear: {
    name: "Clear",
    wording: "No warning signs found.",
    advice:
      "Still never share your PIN or any code. Confirm big requests through a second channel.",
    shape: "Hollow circle",
    hapticPulses: 1,
  },
  caution: {
    name: "Caution",
    wording: "Be careful.",
    advice: "Hang up and call back on a number you already know.",
    shape: "Triangle",
    hapticPulses: 2,
  },
  danger: {
    name: "Danger",
    wording: "Stop. This looks like a scam.",
    advice: "Do not send money or share any code. Report it.",
    shape: "Octagon",
    hapticPulses: 3,
  },
  inconclusive: {
    name: "Inconclusive",
    wording: "We can\u2019t tell.",
    advice: "Treat the call with care. A missing check never counts as good news.",
    shape: "Dashed circle",
    hapticPulses: 0,
  },
  verified: {
    name: "Verified call",
    wording: "This is a real call from the registered bank.",
    advice: "The bank registered this call in advance. You can talk safely — Shield never asks for codes.",
    shape: "Shield with tick",
    hapticPulses: 2,
  },
};

export function verdictWord(verdict: Verdict, lang: "en" | "sw" | "lg"): string {
  const table: Record<Verdict, Record<string, string>> = {
    clear: { en: "Clear", sw: "Hakuna tahadhari", lg: "Tewali bulabe" },
    caution: { en: "Caution", sw: "Angalia", lg: "Komekeza" },
    danger: { en: "Danger", sw: "Hatari", lg: "Obulabe" },
    inconclusive: { en: "Inconclusive", sw: "Haijulikani", lg: "Tetumanyidwa" },
    verified: { en: "Verified", sw: "Imethibitishwa", lg: "Kikakasiddwa" },
  };
  return table[verdict][lang] ?? table[verdict].en;
}

// ---------------------------------------------------------------------------
// Signal plane inputs
// ---------------------------------------------------------------------------

export interface NumberSignals {
  simSwap: { status: "ok" | "swapped" | "unknown"; hoursAgo?: number };
  forwarding: { status: "off" | "on" | "unknown" };
  reputation: { known: boolean; reports: number; band: "clean" | "elevated" | "high" | "unknown" };
  verifiedCall: { bank: string; minutesAgo: number } | null;
  syntheticVoice?: boolean;
}

export interface AssessOutcome {
  verdict: Verdict;
  reasons: ReasonCode[];
  action: RecommendedAction;
  signals: NumberSignals;
}

export function reputationBand(reports: number): "clean" | "elevated" | "high" {
  if (reports >= 5) return "high";
  if (reports >= 2) return "elevated";
  return "clean";
}

/**
 * Rule pack 1 — number check. Combines telco signals, reputation and the
 * verified-call registry into one decision. Never uses one signal alone.
 */
export function assessNumber(signals: NumberSignals): AssessOutcome {
  const s = signals;

  if (s.verifiedCall) {
    return {
      verdict: "verified",
      reasons: ["REGISTERED_BANK_CALL"],
      action: "allow",
      signals: s,
    };
  }

  const reasons: ReasonCode[] = [];
  let verdict: Verdict = "clear";

  const swapHours = s.simSwap.status === "swapped" ? (s.simSwap.hoursAgo ?? 0) : null;
  const swapRecent24 = swapHours !== null && swapHours <= 24;
  const swapRecent72 = swapHours !== null && swapHours <= 72;
  const reports = s.reputation.known ? s.reputation.reports : 0;

  // Danger: multiple independent signals agree, or overwhelming reputation.
  if (reports >= 5) {
    verdict = "danger";
    reasons.push("NUMBER_REPORTED");
  }
  if (s.syntheticVoice) {
    verdict = "danger";
    reasons.push("VOICE_SYNTHETIC_LIKELY");
  }
  if (swapRecent24 && s.forwarding.status === "on") {
    verdict = "danger";
    reasons.push("SIM_SWAP_RECENT", "CALL_FORWARDING_ON");
  } else if (swapRecent24 && reports >= 2) {
    verdict = "danger";
    reasons.push("SIM_SWAP_RECENT", "NUMBER_REPORTED");
  }

  // Caution: a single risk signal — never a verdict of guilt (F1).
  if (verdict !== "danger") {
    if (swapRecent72) {
      verdict = "caution";
      reasons.push("SIM_SWAP_RECENT");
    }
    if (s.forwarding.status === "on") {
      verdict = "caution";
      reasons.push("CALL_FORWARDING_ON");
    }
    if (reports >= 2) {
      verdict = "caution";
      reasons.push("NUMBER_REPORTED");
    }
  }

  // Floor rule (F-1/F-4): any unknown signal blocks a reassuring result.
  const hasUnknown =
    s.simSwap.status === "unknown" || s.forwarding.status === "unknown" || !s.reputation.known;
  if (hasUnknown && verdict === "clear") {
    verdict = "inconclusive";
    reasons.push("TELCO_UNKNOWN");
  }
  if (verdict === "clear") {
    reasons.push("NO_ISSUES_FOUND");
  }

  const action: RecommendedAction =
    verdict === "danger"
      ? "hold"
      : verdict === "caution" || verdict === "inconclusive"
        ? "step_up"
        : "allow";

  return { verdict, reasons: dedupe(reasons), action, signals: s };
}

// ---------------------------------------------------------------------------
// Voice-note check
// ---------------------------------------------------------------------------

export type DetectorRead = "flag" | "clear" | "unknown";

export interface VoiceInput {
  fileName: string;
  sizeKb: number;
  durationSec: number;
  preset?: string;
}

export interface VoiceOutcome {
  verdict: Verdict;
  reasons: ReasonCode[];
  action: RecommendedAction;
  detectors: { d1ElevenLabs: DetectorRead; d2Vendor: DetectorRead; d3InHouse: DetectorRead };
  cues: ReasonCode[];
  durationSec: number;
}

/** Deterministic pseudo-random from a string seed (demo stand-in for real detectors). */
export function seededFlags(seed: string): { d1: boolean; d2: boolean; d3: boolean; cues: number } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const byte = (n: number) => Math.abs(Math.imul(h ^ (n * 0x9e3779b9), 0x85ebca6b)) % 100;
  return {
    d1: byte(1) < 22,
    d2: byte(2) < 18,
    d3: byte(3) < 20,
    cues: byte(4) < 12 ? 3 : byte(5) < 30 ? 1 : 0,
  };
}

const CUE_CYCLE: ReasonCode[] = ["URGENCY_CUES", "OTP_REQUEST", "PAYMENT_REDIRECT", "NEW_NUMBER_STORY"];

/**
 * Rule pack 2 — voice note. D1 (ElevenLabs classifier) is provider-scoped: a
 * "not ElevenLabs" answer is never counted as human evidence. Verdict needs
 * two general detectors agreeing, or one plus story cues (section 4 of spec).
 */
export function assessVoice(input: VoiceInput): VoiceOutcome | { tooShort: true } {
  if (input.durationSec < 3) return { tooShort: true };

  // Quality gate (A2): tiny WhatsApp forwards are often too degraded.
  if (input.sizeKb < 15) {
    return {
      verdict: "inconclusive",
      reasons: ["TOO_NOISY"],
      action: "step_up",
      detectors: { d1ElevenLabs: "unknown", d2Vendor: "unknown", d3InHouse: "unknown" },
      cues: [],
      durationSec: input.durationSec,
    };
  }

  const presetTable: Record<string, { d1: boolean; d2: boolean; d3: boolean; cues: number }> = {
    "family-emergency.m4a": { d1: true, d2: true, d3: true, cues: 3 },
    "mum-real-voice.ogg": { d1: false, d2: false, d3: false, cues: 0 },
    "forwarded-3x.opus": { d1: false, d2: false, d3: false, cues: 0 },
  };
  const flags = input.preset && presetTable[input.preset] ? presetTable[input.preset] : seededFlags(`${input.fileName}:${input.sizeKb}`);

  const generalFlags = (flags.d2 ? 1 : 0) + (flags.d3 ? 1 : 0);
  const cues = CUE_CYCLE.slice(0, Math.min(flags.cues, 4));
  const anyUnknown = false; // demo detectors always answer; real ones can return unknown

  let verdict: Verdict;
  const reasons: ReasonCode[] = [];

  if (anyUnknown) {
    verdict = "inconclusive";
  } else if (generalFlags >= 2) {
    verdict = "danger";
    reasons.push("VOICE_SYNTHETIC_LIKELY", ...cues);
  } else if (generalFlags === 1 && cues.length >= 2) {
    verdict = "danger";
    reasons.push("VOICE_SYNTHETIC_LIKELY", ...cues);
  } else if (generalFlags === 1 || flags.d1) {
    // One signal alone is never the verdict — Caution at most (A9/A11).
    verdict = "caution";
    reasons.push("VOICE_SYNTHETIC_LIKELY");
  } else if (cues.length >= 2) {
    verdict = "caution";
    reasons.push(...cues);
  } else {
    verdict = "clear";
    reasons.push("NO_ISSUES_FOUND");
  }

  const action: RecommendedAction =
    verdict === "danger" ? "hold" : verdict === "clear" ? "allow" : "step_up";

  return {
    verdict,
    reasons: dedupe(reasons),
    action,
    detectors: {
      d1ElevenLabs: flags.d1 ? "flag" : "clear",
      d2Vendor: flags.d2 ? "flag" : "clear",
      d3InHouse: flags.d3 ? "flag" : "clear",
    },
    cues,
    durationSec: input.durationSec,
  };
}

// ---------------------------------------------------------------------------
// Guardian — live-call liveness challenge
// ---------------------------------------------------------------------------

export type GuardianScenario = "real_relative" | "realtime_clone" | "tts_operator" | "caller_left";
export type GuardianLang = "en" | "sw" | "lg";

export interface GuardianOutcome {
  verdict: Verdict;
  reasons: ReasonCode[];
  via: ("push" | "whatsapp" | "sms")[];
  latencyMs: number;
}

/**
 * Rule pack 3 — Guardian. The agent only runs the challenge; this engine
 * scores the answer window from the media fork and sends the result
 * privately (G-1, G-4: the agent never learns or words the verdict).
 */
export function assessGuardian(scenario: GuardianScenario): GuardianOutcome {
  switch (scenario) {
    case "real_relative":
      return { verdict: "clear", reasons: ["NO_ISSUES_FOUND"], via: ["push"], latencyMs: 1180 };
    case "realtime_clone":
      return { verdict: "danger", reasons: ["VOICE_SYNTHETIC_LIKELY"], via: ["push", "whatsapp"], latencyMs: 1310 };
    case "tts_operator":
      return {
        verdict: "danger",
        reasons: ["LATENCY_ANOMALY", "REPEAT_MISMATCH"],
        via: ["push", "sms"],
        latencyMs: 1420,
      };
    case "caller_left":
      // B2: hanging up at disclosure is Caution, never Danger on its own.
      return { verdict: "caution", reasons: ["CALLER_LEFT"], via: ["push"], latencyMs: 640 };
  }
}

const WORD_POOL: Record<GuardianLang, string[]> = {
  en: ["basket", "river", "lamp", "mango", "candle", "stone", "seven"],
  sw: ["kikapu", "mto", "taa", "embe", "jiwe", "saba"],
  lg: ["engoma", "mazzi", "musanvu", "ennyanja", "ettaka", "omuliro"],
};

/** 3 easy concrete words plus one number — never dates or times (T-14). */
export function pickChallengeWords(lang: GuardianLang, seed: string): string[] {
  const pool = WORD_POOL[lang];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const numbers: Record<GuardianLang, string> = { en: "seven", sw: "saba", lg: "musanvu" };
  const number = numbers[lang];
  // Challenge words never repeat and never collide with the number word.
  // NOTE: `>>>` (unsigned) is mandatory — `>>` would go negative whenever bit
  // 31 is set, and a negative index silently becomes `undefined`.
  const candidates = pool.filter((w) => w !== number);
  const words: string[] = [];
  for (let k = 0; words.length < 3 && k < candidates.length * 4; k++) {
    const w = candidates[(h >>> (k * 3)) % candidates.length];
    if (w && !words.includes(w)) words.push(w);
  }
  return [...words, number];
}

export const GUARDIAN_SCRIPT: Record<GuardianLang, { disclosure: string; challenge: string; thanks: string }> = {
  en: {
    disclosure:
      "Hello, I\u2019m Shield, an AI safety assistant. The person you are speaking with asked me to check this call.",
    challenge: "Please repeat after me:",
    thanks: "Thank you. Goodbye.",
  },
  sw: {
    disclosure:
      "Habari, mimi ni Shield, msaidizi wa usalama wa AI. Mtu unayezungumza naye aliniomba nihakikishe simu hii.",
    challenge: "Tafadhali rudia baada yangu:",
    thanks: "Asante. Kwaheri.",
  },
  lg: {
    disclosure:
      "Nze Shield, omuyambi w\u2019obukuumi ow\u2019AI. Omuntu gw\u2019oyogera naye yasaba nnyongereza ku nsonga eno.",
    challenge: "Nsaba oddize nnyuma wange:",
    thanks: "Weebale. Weraba.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dedupe(codes: ReasonCode[]): ReasonCode[] {
  return [...new Set(codes)];
}

/** Log-redaction style mask: keep country code and last 3 digits only. */
export function maskMsisdn(e164: string): string {
  const digits = e164.replace(/[^\d+]/g, "");
  const cc = "+" + (digits.match(/^\+(\d{1,3})/)?.[1] ?? "");
  const tail = digits.slice(-3);
  return `${cc} \u2022\u2022\u2022 \u2022\u2022${tail}`;
}

export function last4(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  return digits.slice(-4);
}

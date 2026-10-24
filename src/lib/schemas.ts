import { z } from "zod";

/**
 * Classification as code (12, section 9.3).
 *
 * Every request field carries its data class, its residency and how it may
 * be logged. `bun run check:data-class` fails the build when a field has no
 * class, so an unclassified field cannot reach a log, a store or an API.
 *
 * The E.164 pattern is enforced after normalisation in the route, so the
 * schema accepts the shapes a user can type.
 */

export const Msisdn = z.string().min(6).max(24).meta({
  dataClass: "C3",
  pii: "phone",
  residency: "cell",
  log: "hash+last3",
  retention: "with-decision",
});

export const FileName = z.string().min(1).max(200).meta({
  dataClass: "C3",
  pii: "file-name",
  residency: "cell",
  log: "id-only",
  retention: "with-decision",
});

export const SizeKb = z.number().int().min(0).max(100_000).meta({
  dataClass: "C1",
  residency: "cell",
  log: "value",
});

export const DurationSec = z.number().min(0).max(600).meta({
  dataClass: "C1",
  residency: "cell",
  log: "value",
});

export const Preset = z.enum(["family-emergency.m4a", "mum-real-voice.ogg", "forwarded-3x.opus"]).meta({
  dataClass: "C1",
  residency: "cell",
  log: "value",
});

export const FreeText = z.string().max(280).meta({
  dataClass: "C3",
  pii: "free-text",
  residency: "cell",
  log: "redacted",
  retention: "13-months",
});

export const AppealReason = z.string().min(10).max(600).meta({
  dataClass: "C3",
  pii: "free-text",
  residency: "cell",
  log: "redacted",
  retention: "13-months",
});

export const AppealId = z.string().min(3).max(64).meta({
  dataClass: "C1",
  residency: "cell",
  log: "value",
});

export const PossessionCode = z.string().min(4).max(12).meta({
  dataClass: "C5",
  pii: "one-time-code",
  residency: "cell",
  log: "never",
  retention: "10-minutes",
});

export const SessionId = z.string().min(3).max(64).meta({
  dataClass: "C1",
  residency: "cell",
  log: "value",
});

export const Language = z.enum(["en", "sw", "lg"]).meta({
  dataClass: "C0",
  residency: "cell",
  log: "value",
});

export const Scenario = z
  .enum(["real_relative", "realtime_clone", "tts_operator", "caller_left"])
  .meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  });

export const AssessBody = z.object({ number: Msisdn });

export const VoiceCheckBody = z.object({
  fileName: FileName,
  sizeKb: SizeKb,
  durationSec: DurationSec,
  preset: Preset.optional(),
});

export const GuardianSessionBody = z.object({
  language: Language,
  scenario: Scenario.optional(),
});

export const GuardianCompleteBody = z.object({
  sessionId: SessionId,
  language: Language.optional(),
});

export const ReportsBody = z.object({
  number: Msisdn,
  note: FreeText.optional(),
});

export const AppealsBody = z.object({
  number: Msisdn,
  reason: AppealReason,
});

export const AppealsVerifyBody = z.object({
  appealId: AppealId,
  code: PossessionCode,
});

/* ------------------------------------------------------------------ */
/* The business tier (17, section 7)                                   */
/* ------------------------------------------------------------------ */

export const BusinessMsisdn = z.string().min(6).max(24).meta({
  dataClass: "C3",
  pii: "phone",
  residency: "cell",
  log: "hash+last3",
  retention: "with-decision",
});

export const Channel = z.enum(["outbound_transfer", "otp_request", "payout", "account_change"]).meta({
  dataClass: "C1",
  residency: "cell",
  log: "value",
});

export const AmountMinor = z.number().int().min(0).max(1_000_000_000_000).meta({
  dataClass: "C3",
  pii: "amount",
  residency: "cell",
  log: "value",
  retention: "with-decision",
});

export const Currency = z.string().length(3).meta({
  dataClass: "C1",
  residency: "cell",
  log: "value",
});

export const ExternalRef = z.string().max(64).meta({
  dataClass: "C1",
  residency: "cell",
  log: "value",
});

export const BusinessAssessBody = z.object({
  msisdn: BusinessMsisdn,
  channel: Channel.optional(),
  amountMinor: AmountMinor.optional(),
  currency: Currency.optional(),
  externalRef: ExternalRef.optional(),
});

export const OtpGuardBody = z.object({
  msisdn: BusinessMsisdn,
  purpose: z.string().max(64).meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  }),
  externalRef: ExternalRef.optional(),
});

export const VerifiedCallRegistration = z.object({
  msisdn: BusinessMsisdn,
  bankName: z.string().min(2).max(80).meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  }),
  market: z.enum(["AE", "KE", "UG", "TZ"]).meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  }),
  minutesValid: z.number().int().min(1).max(90).meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  }),
});

export const OutcomeBody = z.object({
  decisionId: z.string().min(3).max(64).meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  }),
  outcome: z.enum(["fraud_confirmed", "genuine", "unknown"]).meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  }),
  fraudType: z.string().max(64).meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  }),
  lossAmountMinor: AmountMinor.optional(),
  lossCurrency: Currency.optional(),
  confirmedAt: z.string().max(40).meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  }),
});

export const EvidencePackBody = z.object({
  decisionId: z.string().min(3).max(64).meta({
    dataClass: "C1",
    residency: "cell",
    log: "value",
  }),
});

/** The registry the build check walks. */
export const SCHEMA_REGISTRY = {
  AssessBody,
  VoiceCheckBody,
  GuardianSessionBody,
  GuardianCompleteBody,
  ReportsBody,
  AppealsBody,
  AppealsVerifyBody,
  BusinessAssessBody,
  OtpGuardBody,
  VerifiedCallRegistration,
  OutcomeBody,
  EvidencePackBody,
} as const;

import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, ok, problem, readJson } from "@/lib/api";
import { VoiceCheckBody } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { getPorts } from "@/lib/ports-registry";
import { assessVoice, MODEL_VERSIONS, REASON_COPY, RULE_PACK_VERSION } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = VoiceCheckBody;

/** A telco "no swap" signal is never served past its TTL (09, section 1). */
const DECISION_TTL_MS = 15 * 60 * 1000;

/**
 * POST /api/voice-check — public voice-note check.
 * The engine, not a model, decides. In this sandbox the audio never leaves
 * the device: the request carries metadata only, so there is nothing to
 * retain. Production deletes raw audio within 60 s of scoring (SP-1).
 */
export async function POST(req: Request) {
  const started = Date.now();
  const traceId = randomUUID();

  const limit = rateLimit(req, "voice-check", 20);
  if (!limit.ok) {
    return problem(
      429,
      "Too many checks",
      "SH-RATE-429",
      "Please wait a moment before checking another clip.",
      { retryAfterSec: limit.retryAfterSec },
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-AUDIO-422", "fileName, sizeKb and durationSec are required.");
  }

  try {
    // The detector reads come through the detector port; an adapter
    // translates, it never decides (10, section 1).
    const detectorSignal = await getPorts().detector.score({
      fileName: parsed.data.fileName,
      sizeKb: parsed.data.sizeKb,
      durationSec: parsed.data.durationSec,
      preset: parsed.data.preset,
    });
    const reads = detectorSignal.status === "ok" && detectorSignal.value ? detectorSignal.value : undefined;

    const outcome = assessVoice(parsed.data, reads);

    if ("tooShort" in outcome) {
      // A1: under 3 s of speech.
      return problem(
        422,
        "Clip too short",
        "SH-AUDIO-422",
        "We need at least 3 seconds of speech to check a voice note.",
        { safeAction: "inconclusive" },
      );
    }

    const uploadId = "upl_" + randomUUID().replace(/-/g, "").slice(0, 16);
    const latencyMs = Date.now() - started;
    const expiresAt = new Date(Date.now() + DECISION_TTL_MS);

    // The evidence entry, its event and the decision commit together (I-3, A-4).
    const { audit } = await appendAuditWith(
      {
        action: "decision.created",
        resource: uploadId,
        reasonCodes: outcome.reasons,
        input: {
          fileName: parsed.data.fileName,
          sizeKb: parsed.data.sizeKb,
          durationSec: parsed.data.durationSec,
        },
        modelVersions: MODEL_VERSIONS,
        traceId,
      },
      async (tx, entry) =>
        tx.decision.create({
          data: {
            kind: "voice_check",
            subject: uploadId,
            subjectMasked: uploadId,
            verdict: outcome.verdict,
            reasons: JSON.stringify(outcome.reasons),
            action: outcome.action,
            signals: JSON.stringify({ detectors: outcome.detectors, durationSec: outcome.durationSec }),
            latencyMs,
            auditSeq: entry.seq,
            policyVersion: RULE_PACK_VERSION,
            expiresAt,
          },
        }),
      (created, entry) => [
        {
          type: "me.securevoiceai.shield.decision.created.v1",
          subject: created.id,
          lane: "standard",
          data: {
            kind: "voice_check",
            verdict: created.verdict,
            reasons: outcome.reasons,
            auditSeq: entry.seq,
          },
        },
      ],
    );

    return ok({
      checkId: uploadId,
      verdict: outcome.verdict,
      reasons: outcome.reasons,
      reasonCopy: outcome.reasons.map((c) => REASON_COPY[c]),
      recommendedAction: outcome.action,
      detectors: outcome.detectors,
      durationSec: outcome.durationSec,
      latencyMs,
      expiresAt: expiresAt.toISOString(),
      policyVersion: RULE_PACK_VERSION,
      traceId,
      // No audio was uploaded, so none is retained: the sandbox scores the
      // metadata a real detector would score (12, section 9.2).
      audio: {
        received: false,
        retainedSeconds: 0,
        note: "The sandbox never receives audio — it scores metadata only. Production deletes raw audio within 60 s of scoring.",
      },
      audit: { seq: audit.seq, entryHash: audit.entryHash, sig: audit.sig },
    });
  } catch {
    // Detector or evidence failure: Inconclusive territory, never Clear (F-1).
    return degraded(
      "The detectors could not be reached, so no verdict was produced. Treat the clip as unverified — call back on a number you saved.",
      { safeAction: "inconclusive" },
    );
  }
}

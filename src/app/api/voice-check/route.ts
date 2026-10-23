import { z } from "zod";
import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { degraded, ok, problem, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { assessVoice, REASON_COPY } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = z.object({
  fileName: z.string().min(1).max(200),
  sizeKb: z.number().int().min(0).max(100_000),
  durationSec: z.number().min(0).max(600),
  preset: z.string().max(64).optional(),
});

/**
 * POST /api/voice-check — public voice-note check.
 * The engine, not a model, decides. Audio itself never leaves the client in
 * this demo; production deletes it within 60 s of scoring (SP-1).
 */
export async function POST(req: Request) {
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
    const outcome = assessVoice(parsed.data);

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

    const uploadId = "upl_" + Math.random().toString(36).slice(2, 10);
    const audit = await appendAudit({
      action: "decision.created",
      resource: uploadId,
      reasonCodes: outcome.reasons,
      input: { fileName: parsed.data.fileName, sizeKb: parsed.data.sizeKb, durationSec: parsed.data.durationSec },
    });

    await db.decision.create({
      data: {
        kind: "voice_check",
        subject: uploadId,
        subjectMasked: uploadId,
        verdict: outcome.verdict,
        reasons: JSON.stringify(outcome.reasons),
        action: outcome.action,
        signals: JSON.stringify({ detectors: outcome.detectors, durationSec: outcome.durationSec }),
        latencyMs: 380 + Math.floor(Math.random() * 220),
        auditSeq: audit.seq,
      },
    });

    return ok({
      checkId: uploadId,
      verdict: outcome.verdict,
      reasons: outcome.reasons,
      reasonCopy: outcome.reasons.map((c) => REASON_COPY[c]),
      recommendedAction: outcome.action,
      detectors: outcome.detectors,
      durationSec: outcome.durationSec,
      audioDeletedAfterSec: 60,
      audit: { seq: audit.seq, entryHash: audit.entryHash },
    });
  } catch {
    // Detector or evidence failure: Inconclusive territory, never Clear (F-1).
    return degraded(
      "The detectors could not be reached, so no verdict was produced. Treat the clip as unverified — call back on a number you saved.",
      { safeAction: "inconclusive" },
    );
  }
}

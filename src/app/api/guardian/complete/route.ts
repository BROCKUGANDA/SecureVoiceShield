import { z } from "zod";
import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { degraded, ok, problem, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import {
  assessGuardian,
  REASON_COPY,
  verdictWord,
  type GuardianLang,
  type GuardianScenario,
} from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = z.object({
  sessionId: z.string().min(3).max(40),
  scenario: z.enum(["real_relative", "realtime_clone", "tts_operator", "caller_left"]),
  language: z.enum(["en", "sw", "lg"]),
});

/**
 * POST /api/guardian/complete — engine scores the answer window and commits
 * the private result. The agent never sees any of this (G-1, G-4).
 */
export async function POST(req: Request) {
  const limit = rateLimit(req, "guardian-complete", 20);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-GUARDIAN-422");
  }
  const { sessionId, scenario, language } = parsed.data;

  try {
    const outcome = assessGuardian(scenario as GuardianScenario);
    const lang = language as GuardianLang;

    const audit = await appendAudit({
      action: "guardian.completed",
      resource: sessionId,
      reasonCodes: outcome.reasons,
      input: { sessionId, scenario },
    });

    await db.decision.create({
      data: {
        kind: "guardian",
        subject: sessionId,
        subjectMasked: "live call \u2022 " + sessionId,
        verdict: outcome.verdict,
        reasons: JSON.stringify(outcome.reasons),
        action: outcome.verdict === "danger" ? "hold" : outcome.verdict === "clear" ? "allow" : "step_up",
        signals: JSON.stringify({ scenario, language }),
        latencyMs: outcome.latencyMs,
        auditSeq: audit.seq,
      },
    });

    return ok({
      sessionId,
      verdict: outcome.verdict,
      verdictWord: verdictWord(outcome.verdict, lang),
      reasons: outcome.reasons,
      reasonCopy: outcome.reasons.map((c) => REASON_COPY[c]),
      deliveredVia: outcome.via,
      hapticPulses: outcome.verdict === "danger" ? 3 : outcome.verdict === "caution" ? 2 : 1,
      inCallLatencyMs: outcome.latencyMs,
      audit: { seq: audit.seq, entryHash: audit.entryHash },
    });
  } catch {
    // The private result could not be committed: say so, never fake one (G-4).
    return degraded(
      "The private result could not be committed. If the call continues, treat it as unverified and call back on a saved number.",
    );
  }
}

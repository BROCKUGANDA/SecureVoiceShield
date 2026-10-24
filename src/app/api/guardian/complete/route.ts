import { z } from "zod";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, ok, problem, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import {
  assessGuardian,
  REASON_COPY,
  VERDICT_META,
  verdictWord,
  type GuardianLang,
  type GuardianScenario,
  type Verdict,
} from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = z.object({
  sessionId: z.string().min(3).max(64),
  language: z.enum(["en", "sw", "lg"]).optional(),
});

/**
 * POST /api/guardian/complete — the engine scores the answer window and
 * commits the private result. The agent never sees any of this (G-1, G-4).
 *
 * The scenario comes from the server-side session, not from the request: the
 * media fork decides the outcome of a live call.
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
  const { sessionId } = parsed.data;

  try {
    const session = await db.guardianSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      return problem(
        422,
        "Unknown session",
        "SH-GUARDIAN-422",
        "This Guardian session does not exist. Start a new session before scoring a call.",
        { safeAction: "step_up" },
      );
    }
    if (session.expiresAt.getTime() < Date.now()) {
      return problem(
        422,
        "Session expired",
        "SH-GUARDIAN-422",
        "This Guardian session has expired. Start a new session before scoring a call.",
        { safeAction: "step_up" },
      );
    }

    // Replaying a completed session returns the same committed result.
    const existing = await db.decision.findFirst({ where: { kind: "guardian", subject: sessionId } });
    if (existing) {
      const reasons = JSON.parse(existing.reasons) as string[];
      const entry = await db.auditEntry.findUnique({ where: { seq: existing.auditSeq } });
      const signals = JSON.parse(existing.signals) as { scenario?: string; language?: string };
      const replayOutcome = assessGuardian((signals.scenario ?? "real_relative") as GuardianScenario);
      return ok({
        sessionId,
        verdict: existing.verdict,
        verdictWord: verdictWord(existing.verdict as Verdict, langOf(session.language)),
        reasons,
        reasonCopy: reasons.map((c) => REASON_COPY[c as keyof typeof REASON_COPY] ?? c),
        deliveredVia: replayOutcome.via,
        hapticPulses: VERDICT_META[existing.verdict as keyof typeof VERDICT_META]?.hapticPulses ?? 0,
        inCallLatencyMs: existing.latencyMs,
        audit: { seq: existing.auditSeq, entryHash: entry?.entryHash },
        replayed: true,
      });
    }

    const outcome = assessGuardian(session.scenario as GuardianScenario);
    const lang = (parsed.data.language ?? session.language) as GuardianLang;

    // The evidence entry and the decision commit together (I-3).
    const { audit, result: decision } = await appendAuditWith(
      {
        action: "guardian.completed",
        resource: sessionId,
        reasonCodes: outcome.reasons,
        input: { sessionId, scenario: session.scenario, language: session.language },
      },
      async (tx, entry) => {
        const created = await tx.decision.create({
          data: {
            kind: "guardian",
            subject: sessionId,
            subjectMasked: "live call • " + sessionId,
            verdict: outcome.verdict,
            reasons: JSON.stringify(outcome.reasons),
            action: outcome.verdict === "danger" ? "hold" : outcome.verdict === "clear" ? "allow" : "step_up",
            signals: JSON.stringify({ scenario: session.scenario, language: session.language }),
            latencyMs: outcome.latencyMs,
            auditSeq: entry.seq,
          },
        });
        await tx.guardianSession.update({
          where: { id: sessionId },
          data: { completedAt: new Date() },
        });
        return created;
      },
    );

    return ok({
      sessionId,
      verdict: outcome.verdict,
      verdictWord: verdictWord(outcome.verdict, lang),
      reasons: outcome.reasons,
      reasonCopy: outcome.reasons.map((c) => REASON_COPY[c]),
      deliveredVia: outcome.via,
      hapticPulses: VERDICT_META[outcome.verdict].hapticPulses,
      inCallLatencyMs: outcome.latencyMs,
      audit: { seq: audit.seq, entryHash: audit.entryHash },
      replayed: false,
    });
  } catch {
    // The private result could not be committed: say so, never fake one (G-4).
    return degraded(
      "The private result could not be committed. If the call continues, treat it as unverified and call back on a saved number.",
    );
  }
}

function langOf(language: string): GuardianLang {
  return language === "sw" || language === "lg" ? language : "en";
}

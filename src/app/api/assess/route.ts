import { z } from "zod";
import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { ensureSeed } from "@/lib/demo-seed";
import { E164_RE, ok, problem, sanitizeNumber } from "@/lib/api";
import {
  assessNumber,
  last4,
  maskMsisdn,
  REASON_COPY,
  reputationBand,
  type AssessOutcome,
} from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = z.object({ number: z.string().min(6).max(24) });

/**
 * POST /api/assess — the moment-of-risk check.
 * Sandbox magic numbers (10, section 4.3) make every behaviour reproducible.
 */
export async function POST(req: Request) {
  const started = Date.now();
  await ensureSeed();

  const idemKey = req.headers.get("Idempotency-Key") ?? undefined;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Invalid JSON body", "SH-BODY-400");
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-NUMBER-422", "`number` must be a phone number.");
  }
  const e164 = sanitizeNumber(parsed.data.number);
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format, e.g. +256772123456.");
  }

  // Idempotent receiver (I-3): same key replays the stored response byte-for-byte.
  if (idemKey) {
    const replay = await db.decision.findUnique({ where: { idemKey } });
    if (replay) {
      return ok(
        {
          decisionId: replay.id,
          subject: replay.subjectMasked,
          verdict: replay.verdict,
          reasons: JSON.parse(replay.reasons),
          reasonCopy: (JSON.parse(replay.reasons) as string[]).map(
            (c) => REASON_COPY[c as keyof typeof REASON_COPY] ?? c,
          ),
          recommendedAction: replay.action,
          latencyMs: replay.latencyMs,
          audit: { seq: replay.auditSeq },
          replayed: true,
        },
        "NORMAL",
      );
    }
  }

  const magic = last4(e164);
  let outcome: AssessOutcome;
  let forcedLatency = 0;

  if (magic === "0001") {
    outcome = assessNumber({
      simSwap: { status: "swapped", hoursAgo: 2 },
      forwarding: { status: "off" },
      reputation: { known: true, reports: 0, band: "clean" },
      verifiedCall: null,
    });
  } else if (magic === "0002") {
    outcome = assessNumber({
      simSwap: { status: "ok" },
      forwarding: { status: "on" },
      reputation: { known: true, reports: 0, band: "clean" },
      verifiedCall: null,
    });
  } else if (magic === "0003") {
    outcome = assessNumber({
      simSwap: { status: "unknown" },
      forwarding: { status: "unknown" },
      reputation: { known: true, reports: 0, band: "clean" },
      verifiedCall: null,
    });
  } else if (magic === "0004") {
    outcome = assessNumber({
      simSwap: { status: "ok" },
      forwarding: { status: "off" },
      reputation: { known: true, reports: 9, band: "high" },
      verifiedCall: null,
    });
  } else if (magic === "0005") {
    outcome = assessNumber({
      simSwap: { status: "ok" },
      forwarding: { status: "off" },
      reputation: { known: true, reports: 1, band: "clean" },
      verifiedCall: null,
      syntheticVoice: true,
    });
  } else if (magic === "0006") {
    outcome = assessNumber({
      simSwap: { status: "ok" },
      forwarding: { status: "off" },
      reputation: { known: true, reports: 0, band: "clean" },
      verifiedCall: { bank: "Partner bank (demo registry)", minutesAgo: 4 },
    });
  } else if (magic === "0007") {
    // Slow response: tests the client timeout contract (fail toward step_up).
    await new Promise((r) => setTimeout(r, 950));
    forcedLatency = 950;
    outcome = assessNumber({
      simSwap: { status: "ok" },
      forwarding: { status: "off" },
      reputation: { known: true, reports: 0, band: "clean" },
      verifiedCall: null,
    });
  } else if (magic === "0008") {
    return problem(503, "Service degraded", "SH-MODE-503", "READ_ONLY mode: no new decisions.", {
      safeAction: "step_up",
    });
  } else {
    // Real numbers: live reputation from the shared report pool.
    const reports = await db.scamReport.count({ where: { numberE164: e164 } });
    outcome = assessNumber({
      simSwap: { status: "ok" },
      forwarding: { status: "off" },
      reputation: { known: true, reports, band: reputationBand(reports) },
      verifiedCall: null,
    });
  }

  const latencyMs = forcedLatency || Math.max(42, Date.now() - started);
  const masked = maskMsisdn(e164);

  const audit = await appendAudit({
    action: "decision.created",
    resource: "assess",
    reasonCodes: outcome.reasons,
    input: { number: e164 },
  });

  const decision = await db.decision.create({
    data: {
      idemKey: idemKey ?? null,
      kind: "number_check",
      subject: e164,
      subjectMasked: masked,
      verdict: outcome.verdict,
      reasons: JSON.stringify(outcome.reasons),
      action: outcome.action,
      signals: JSON.stringify(outcome.signals),
      latencyMs,
      auditSeq: audit.seq,
    },
  });

  return ok(
    {
      decisionId: decision.id,
      subject: masked,
      verdict: outcome.verdict,
      reasons: outcome.reasons,
      reasonCopy: outcome.reasons.map((c) => REASON_COPY[c]),
      recommendedAction: outcome.action,
      signals: outcome.signals,
      latencyMs,
      audit: { seq: audit.seq, entryHash: audit.entryHash, prevHash: audit.prevHash },
      replayed: false,
    },
    "NORMAL",
  );
}

export function GET() {
  return problem(405, "Method not allowed", "SH-METHOD-405", "POST /api/assess.");
}

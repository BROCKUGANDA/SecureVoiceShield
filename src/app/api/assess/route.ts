import { createHash } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { ensureSeed } from "@/lib/demo-seed";
import { conflict, degraded, E164_RE, ok, problem, readJson, sanitizeNumber } from "@/lib/api";
import { rateLimit, rateLimitSubject } from "@/lib/rate-limit";
import { hmacNumber } from "@/lib/pepper";
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

/** Idempotency keys dedupe for 24 hours (10). */
const IDEM_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Reputation is counted over 14 days (09). */
const REPUTATION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** The body hash stored with an idempotency key (10). */
function bodyHash(kind: string, number: string): string {
  return "sha256:" + createHash("sha256").update(`${kind}:${number.replace(/\D/g, "")}`).digest("hex");
}

/**
 * POST /api/assess — the moment-of-risk check.
 * Sandbox magic numbers (10, section 4.3) make every behaviour reproducible.
 */
export async function POST(req: Request) {
  const started = Date.now();

  const limit = rateLimit(req, "assess", 30);
  if (!limit.ok) {
    return problem(
      429,
      "Too many checks",
      "SH-RATE-429",
      "Slow down — Shield stays free by staying calm. Try again shortly.",
      { retryAfterSec: limit.retryAfterSec },
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  const idemKeyHeader = req.headers.get("Idempotency-Key");
  if (idemKeyHeader && idemKeyHeader.length > 64) {
    return problem(422, "Invalid Idempotency-Key", "SH-IDEM-422", "The key must be 64 characters or fewer.");
  }
  const idemKey = idemKeyHeader ?? undefined;

  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-NUMBER-422", "`number` must be a phone number.");
  }
  const e164 = sanitizeNumber(parsed.data.number);
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format, e.g. +256772123456.");
  }

  // 09: 20 checks per minute per subject number — keyed on the number, so
  // rotating the source address cannot lift it.
  const subjectLimit = rateLimitSubject("assess-subject", hmacNumber(e164), 20);
  if (!subjectLimit.ok) {
    return problem(
      429,
      "Too many checks for this number",
      "SH-RATE-429",
      "You have checked this number several times in a row. Wait a moment before checking again.",
      { retryAfterSec: subjectLimit.retryAfterSec },
      { "Retry-After": String(subjectLimit.retryAfterSec) },
    );
  }

  try {
    await ensureSeed();

    // Idempotent receiver (10): the body hash travels with the key, so a
    // replay of the same key for a different number is a conflict, never a
    // silently wrong answer.
    const hash = bodyHash("number_check", e164);
    if (idemKey) {
      const existing = await db.decision.findUnique({ where: { idemKey } });
      if (existing) {
        const age = Date.now() - existing.createdAt.getTime();
        if (existing.idemBodyHash === hash && age <= IDEM_WINDOW_MS) {
          const entry = await db.auditEntry.findUnique({ where: { seq: existing.auditSeq } });
          const reasons = JSON.parse(existing.reasons) as string[];
          return ok(
            {
              decisionId: existing.id,
              subject: existing.subjectMasked,
              verdict: existing.verdict,
              reasons,
              reasonCopy: reasons.map((c) => REASON_COPY[c as keyof typeof REASON_COPY] ?? c),
              recommendedAction: existing.action,
              signals: JSON.parse(existing.signals),
              latencyMs: existing.latencyMs,
              audit: {
                seq: existing.auditSeq,
                entryHash: entry?.entryHash,
                prevHash: entry?.prevHash,
              },
              replayed: true,
            },
          );
        }
        if (existing.idemBodyHash !== null && existing.idemBodyHash !== hash) {
          return conflict(
            "This idempotency key was already used for a different number. Use a new key for a new check.",
          );
        }
        // The 24 h window has passed (or the key predates body hashes): free
        // the key so it can be reused. Only the transport field changes — the
        // decision and its evidence entry are left untouched.
        await db.decision.update({
          where: { id: existing.id },
          data: { idemKey: `retired:${existing.id}` },
        });
      }
    }

    const magic = last4(e164);
    let outcome: AssessOutcome;

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
      // Real numbers: independent reporters over the last 14 days.
      const numberHash = hmacNumber(e164);
      const reports = await db.scamReport.count({
        where: {
          numberHash,
          createdAt: { gte: new Date(Date.now() - REPUTATION_WINDOW_MS) },
        },
      });
      outcome = assessNumber({
        simSwap: { status: "ok" },
        forwarding: { status: "off" },
        reputation: { known: true, reports, band: reputationBand(reports) },
        verifiedCall: null,
      });
    }

    const latencyMs = Date.now() - started;
    const masked = maskMsisdn(e164);

    // The evidence entry and the decision commit together (I-3).
    const { audit, result: decision } = await appendAuditWith(
      {
        action: "decision.created",
        resource: "assess",
        reasonCodes: outcome.reasons,
        input: { numberHash: hmacNumber(e164) },
      },
      async (tx, entry) =>
        tx.decision.create({
          data: {
            idemKey: idemKey ?? null,
            idemBodyHash: idemKey ? hash : null,
            kind: "number_check",
            subject: hmacNumber(e164),
            subjectMasked: masked,
            verdict: outcome.verdict,
            reasons: JSON.stringify(outcome.reasons),
            action: outcome.action,
            signals: JSON.stringify(outcome.signals),
            latencyMs,
            auditSeq: entry.seq,
          },
        }),
    );

    return ok({
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
    });
  } catch {
    // Evidence store unavailable: fail toward verification, never clear (F-1).
    return degraded("The evidence store is unavailable, so this check is treated as inconclusive. Never treat silence as safe.");
  }
}

export function GET() {
  return problem(405, "Method not allowed", "SH-METHOD-405", "POST /api/assess.");
}

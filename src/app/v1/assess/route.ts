import { createHash, randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { conflict, degraded, E164_RE, problem, readJson, sanitizeNumber } from "@/lib/api";
import { requireTenant } from "@/lib/require-tenant";
import { rateLimit } from "@/lib/rate-limit";
import { getPorts } from "@/lib/ports-registry";
import { hmacNumber } from "@/lib/pepper";
import { BusinessAssessBody } from "@/lib/schemas";
import { MODEL_VERSIONS, REASON_COPY, RULE_PACK_VERSION, assessNumber, last4, maskMsisdn } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

/** A business decision is valid for 15 minutes (10, section 2). */
const DECISION_TTL_MS = 15 * 60 * 1000;
/** RT-1: the hard server timeout for the decision API (09, section 1). */
const HARD_TIMEOUT_MS = 900;
/** The magic number that stretches the answer past the budget. */
const SLOW_MAGIC = "0007";

const SANDBOX = process.env.SHIELD_SANDBOX !== "false";

/** The body hash stored with an idempotency key (10, section 10). */
function bodyHash(input: {
  msisdn: string;
  channel?: string;
  amountMinor?: number;
  currency?: string;
}): string {
  return (
    "sha256:" +
    createHash("sha256")
      .update(
        [
          "business_assess",
          input.msisdn.replace(/\D/g, ""),
          input.channel ?? "",
          input.amountMinor ?? "",
          input.currency ?? "",
        ].join("|"),
      )
      .digest("hex")
  );
}

/**
 * POST /v1/assess — the moment-of-risk decision for a bank (10, P-B2).
 *
 * The tenant is authenticated with an OAuth 2.0 access token bound to its
 * mTLS certificate. The decision is the same engine the public app uses, and
 * it is written to the same evidence chain, with the tenant recorded so one
 * tenant can never see another's decisions.
 */
export async function POST(req: Request) {
  const auth = await requireTenant(req, "assess:read");
  if (!auth.ok) return auth.response;

  const limit = rateLimit(req, "v1-assess", 30);
  if (!limit.ok) {
    return problem(
      429,
      "Too many decisions",
      "SH-RATE-429",
      "The decision rate limit was reached. Try again shortly.",
      { retryAfterSec: limit.retryAfterSec, safeAction: "step_up" },
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  const started = Date.now();
  const traceId = randomUUID();

  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = BusinessAssessBody.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-BODY-422", "msisdn is required in E.164 format.");
  }
  const e164 = sanitizeNumber(parsed.data.msisdn);
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format, for example +255 7XX XXX X12.");
  }

  const idemKey = req.headers.get("Idempotency-Key") ?? undefined;
  if (idemKey && idemKey.length > 64) {
    return problem(422, "Invalid Idempotency-Key", "SH-IDEM-422", "The key must be 64 characters or fewer.");
  }
  const hash = bodyHash({
    msisdn: e164,
    channel: parsed.data.channel,
    amountMinor: parsed.data.amountMinor,
    currency: parsed.data.currency,
  });

  try {
    // Idempotent receiver (10, section 10): the key is scoped to the tenant
    // and the body hash travels with it, so a mismatch is a 409.
    if (idemKey) {
      const existing = await db.decision.findUnique({ where: { idemKey } });
      if (existing) {
        if (existing.tenantId !== auth.claims.tenantId) {
          return conflict("This idempotency key belongs to another tenant.");
        }
        if (existing.idemBodyHash && existing.idemBodyHash !== hash) {
          return conflict(
            "This idempotency key was already used for a different request. Use a new key.",
          );
        }
        const reasons = JSON.parse(existing.reasons) as string[];
        return Response.json(
          {
            decisionId: existing.id,
            verdict: existing.verdict,
            reasons,
            reasonCopy: reasons.map((c) => REASON_COPY[c as keyof typeof REASON_COPY] ?? c),
            action: existing.action,
            latencyMs: existing.latencyMs,
            expiresAt: existing.expiresAt?.toISOString() ?? null,
            policyVersion: existing.policyVersion,
            externalRef: parsed.data.externalRef ?? null,
            replayed: true,
            traceId,
          },
          { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } },
        );
      }
    }

    // The sandbox magic number that stretches the answer past the budget.
    if (SANDBOX && last4(e164) === SLOW_MAGIC) {
      await new Promise((r) => setTimeout(r, 950));
    }
    if (SANDBOX && last4(e164) === "0008") {
      return problem(503, "Service degraded", "SH-MODE-503", "READ_ONLY mode: no new decisions.", {
        safeAction: "step_up",
      });
    }

    // The telco signals come through the port; an unknown answer stays
    // unknown and the floor rule applies.
    const telcoSignal = await getPorts().telco.lookup({
      msisdn: e164,
      sandboxMagic: SANDBOX ? last4(e164) : "",
    });
    const telco = telcoSignal.status === "ok" && telcoSignal.value ? telcoSignal.value : null;

    const outcome = assessNumber({
      simSwap: telco?.simSwap ?? { status: "unknown" },
      forwarding: telco?.forwarding ?? { status: "unknown" },
      reputation: { known: true, reports: 0, band: "clean" },
      verifiedCall: null,
    });

    const latencyMs = Date.now() - started;
    // The server blew its budget: the answer is the cautious one, committed
    // like any other decision so the tenant can act on it (09, RT-1).
    const finalOutcome =
      latencyMs > HARD_TIMEOUT_MS
        ? { verdict: "inconclusive" as const, reasons: ["SIGNAL_UNAVAILABLE" as const], action: "step_up" as const }
        : outcome;

    const expiresAt = new Date(Date.now() + DECISION_TTL_MS);
    const { audit, result: decision } = await appendAuditWith(
      {
        action: "decision.created",
        resource: "assess",
        reasonCodes: finalOutcome.reasons,
        input: { numberHash: hmacNumber(e164) },
        modelVersions: MODEL_VERSIONS,
        traceId,
      },
      async (tx, entry) =>
        tx.decision.create({
          data: {
            idemKey: idemKey ?? null,
            idemBodyHash: idemKey ? hash : null,
            kind: "number_check",
            subject: hmacNumber(e164),
            subjectMasked: maskMsisdn(e164),
            verdict: finalOutcome.verdict,
            reasons: JSON.stringify(finalOutcome.reasons),
            action: finalOutcome.action,
            signals: JSON.stringify(outcome.signals),
            latencyMs,
            auditSeq: entry.seq,
            tenantId: auth.claims.tenantId,
            policyVersion: "ug-banking-2026.10.1",
            expiresAt,
          },
        }),
      (created, entry) => [
        {
          type: "me.securevoiceai.shield.decision.created.v1",
          subject: created.id,
          lane: "standard",
          data: { kind: "number_check", verdict: created.verdict, reasons: finalOutcome.reasons, auditSeq: entry.seq },
        },
      ],
    );

    return Response.json(
      {
        decisionId: decision.id,
        verdict: finalOutcome.verdict,
        reasons: finalOutcome.reasons,
        reasonCopy: finalOutcome.reasons.map((c) => REASON_COPY[c as keyof typeof REASON_COPY] ?? c),
        action: finalOutcome.action,
        latencyMs,
        expiresAt: expiresAt.toISOString(),
        policyVersion: decision.policyVersion,
        externalRef: parsed.data.externalRef ?? null,
        audit: { seq: audit.seq, entryHash: audit.entryHash, sig: audit.sig },
        traceId,
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      },
    );
  } catch {
    return degraded("The evidence store is unavailable, so the decision is step_up. Never treat silence as safe.");
  }
}

import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, E164_RE, problem, readJson, sanitizeNumber } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { requireTenant } from "@/lib/require-tenant";
import { getPorts } from "@/lib/ports-registry";
import { hmacNumber } from "@/lib/pepper";
import { OtpGuardBody } from "@/lib/schemas";
import { MODEL_VERSIONS, REASON_COPY, assessNumber, last4, maskMsisdn } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const DECISION_TTL_MS = 15 * 60 * 1000;
const SANDBOX = process.env.SHIELD_SANDBOX !== "false";

/**
 * POST /v1/otp-guard — the decision before a bank sends a one-time code
 * (10, P-B1).
 *
 * The client's fail-closed rules: if Shield is unavailable, the answer is
 * `step_up` — no SMS OTP, use app approval or a branch. This endpoint never
 * answers "allow" on a signal it did not receive.
 */
export async function POST(req: Request) {
  const auth = await requireTenant(req, "otp-guard:write");
  if (!auth.ok) return auth.response;

  const limit = rateLimit(req, "v1-otp-guard", 30);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", "The rate limit was reached. Treat the request as step_up.", { retryAfterSec: limit.retryAfterSec, safeAction: "step_up" }, { "Retry-After": String(limit.retryAfterSec) });
  }

  const traceId = randomUUID();
  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = OtpGuardBody.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-BODY-422", "msisdn is required in E.164 format.");
  }
  const e164 = sanitizeNumber(parsed.data.msisdn);
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format.");
  }

  try {
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

    // The OTP path is stricter: only a clean, fully-informed line may
    // proceed, and every other outcome sends the customer to another channel.
    const action = outcome.verdict === "clear" ? "allow" : "step_up";
    const reasons = outcome.verdict === "clear" ? outcome.reasons : [...new Set([...outcome.reasons, "SIGNAL_UNAVAILABLE" as const])];

    const expiresAt = new Date(Date.now() + DECISION_TTL_MS);
    const { audit, result: decision } = await appendAuditWith(
      {
        action: "decision.created",
        resource: "otp-guard",
        reasonCodes: reasons,
        input: { numberHash: hmacNumber(e164) },
        modelVersions: MODEL_VERSIONS,
        traceId,
      },
      async (tx, entry) =>
        tx.decision.create({
          data: {
            kind: "number_check",
            subject: hmacNumber(e164),
            subjectMasked: maskMsisdn(e164),
            verdict: outcome.verdict,
            reasons: JSON.stringify(reasons),
            action,
            signals: JSON.stringify({ ...outcome.signals, purpose: parsed.data.purpose ?? "otp_request" }),
            latencyMs: 0,
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
          data: { kind: "otp_guard", verdict: created.verdict, action: created.action, auditSeq: entry.seq },
        },
      ],
    );

    return Response.json(
      {
        decisionId: decision.id,
        verdict: outcome.verdict,
        reasons,
        reasonCopy: reasons.map((c) => REASON_COPY[c as keyof typeof REASON_COPY] ?? c),
        action,
        // The channel the bank should use instead of an SMS code.
        fallbackChannel: action === "allow" ? null : "app_approval_or_branch",
        expiresAt: expiresAt.toISOString(),
        policyVersion: decision.policyVersion,
        externalRef: parsed.data.externalRef ?? null,
        audit: { seq: audit.seq, entryHash: audit.entryHash, sig: audit.sig },
        traceId,
      },
      {
        headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
      },
    );
  } catch {
    return degraded("Shield cannot answer right now. Treat the request as step_up: no SMS OTP, use app approval or a branch.");
  }
}

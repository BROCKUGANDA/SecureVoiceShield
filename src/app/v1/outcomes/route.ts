import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, problem, readJson } from "@/lib/api";
import { requireTenant } from "@/lib/require-tenant";
import { OutcomeBody } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

/**
 * POST /v1/outcomes — the bank's label for a decision (13, section 5.3).
 *
 * `fraud_confirmed`, `genuine` or `unknown`. A decision with no label counts
 * as unknown, never as genuine — the model-risk metrics depend on it.
 */
export async function POST(req: Request) {
  const auth = await requireTenant(req, "outcomes:write");
  if (!auth.ok) return auth.response;

  const traceId = randomUUID();
  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = OutcomeBody.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-BODY-422", "decisionId and outcome are required.");
  }

  try {
    // A tenant may only label its own decision.
    const decision = await db.decision.findUnique({ where: { id: parsed.data.decisionId } });
    if (!decision || decision.tenantId !== auth.claims.tenantId) {
      return problem(404, "Decision not found", "SH-OUTCOME-404", "No such decision for this tenant.");
    }

    const { audit, result: outcome } = await appendAuditWith(
      {
        action: "outcome.recorded",
        resource: decision.id,
        input: { decisionId: decision.id, outcome: parsed.data.outcome },
        traceId,
      },
      async (tx) =>
        tx.outcome.upsert({
          where: { tenantId_decisionId: { tenantId: auth.claims.tenantId, decisionId: decision.id } },
          update: {
            outcome: parsed.data.outcome,
            fraudType: parsed.data.fraudType ?? null,
            lossAmountMinor: parsed.data.lossAmountMinor ?? null,
            lossCurrency: parsed.data.lossCurrency ?? null,
            confirmedAt: parsed.data.confirmedAt ? new Date(parsed.data.confirmedAt) : null,
          },
          create: {
            tenantId: auth.claims.tenantId,
            decisionId: decision.id,
            outcome: parsed.data.outcome,
            fraudType: parsed.data.fraudType ?? null,
            lossAmountMinor: parsed.data.lossAmountMinor ?? null,
            lossCurrency: parsed.data.lossCurrency ?? null,
            confirmedAt: parsed.data.confirmedAt ? new Date(parsed.data.confirmedAt) : null,
          },
        }),
      (created, entry) => [
        {
          type: "me.securevoiceai.shield.outcome.recorded.v1",
          subject: created.decisionId,
          lane: "standard",
          data: { outcome: created.outcome, auditSeq: entry.seq },
        },
      ],
    );

    return Response.json(
      {
        outcomeId: outcome.id,
        decisionId: outcome.decisionId,
        outcome: outcome.outcome,
        fraudType: outcome.fraudType,
        lossAmountMinor: outcome.lossAmountMinor,
        lossCurrency: outcome.lossCurrency,
        confirmedAt: outcome.confirmedAt?.toISOString() ?? null,
        recordedAt: outcome.createdAt.toISOString(),
        audit: { seq: audit.seq, entryHash: audit.entryHash, sig: audit.sig },
        traceId,
      },
      { headers: NO_STORE },
    );
  } catch {
    return degraded("The outcome could not be recorded.");
  }
}

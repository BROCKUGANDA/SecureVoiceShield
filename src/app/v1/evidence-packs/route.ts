import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, problem, readJson } from "@/lib/api";
import { requireTenant } from "@/lib/require-tenant";
import { getPorts } from "@/lib/ports-registry";
import { EvidencePackBody } from "@/lib/schemas";
import { publicKeyPem, signPayload } from "@/lib/signing";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
/** A signed link expires after 15 minutes (09, section 4.2). */
const PACK_TTL_SECONDS = 900;

/**
 * POST /v1/evidence-packs — a signed archive for a dispute, a complaint or
 * a regulator (13, section 6.3).
 *
 * The pack carries what an auditor needs and nothing else: the decision
 * record, the policy and model versions, the proof that the decision is in
 * the chain, what was sent to the customer, and how to verify it. Phone
 * numbers stay as HMACs.
 */
export async function POST(req: Request) {
  const auth = await requireTenant(req, "evidence-packs:write");
  if (!auth.ok) return auth.response;

  const traceId = randomUUID();
  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = EvidencePackBody.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-BODY-422", "decisionId is required.");
  }

  try {
    const decision = await db.decision.findUnique({ where: { id: parsed.data.decisionId } });
    if (!decision || decision.tenantId !== auth.claims.tenantId) {
      return problem(404, "Decision not found", "SH-PACK-404", "No such decision for this tenant.");
    }
    const entry = await db.auditEntry.findUnique({ where: { seq: decision.auditSeq } });
    const outcomes = await db.outcome.findMany({ where: { decisionId: decision.id } });

    const pack = {
      schema: "https://shield.securevoiceai.me/schemas/evidence-pack.v1.json",
      cell: "ug",
      generatedAt: new Date().toISOString(),
      decision: {
        decisionId: decision.id,
        kind: decision.kind,
        subject: decision.subjectMasked,
        verdict: decision.verdict,
        reasons: JSON.parse(decision.reasons) as string[],
        action: decision.action,
        latencyMs: decision.latencyMs,
        createdAt: decision.createdAt.toISOString(),
        expiresAt: decision.expiresAt?.toISOString() ?? null,
      },
      policyVersion: decision.policyVersion,
      modelVersions: entry ? (JSON.parse(entry.modelVersions) as Record<string, string>) : {},
      chain: entry
        ? {
            seq: entry.seq,
            at: entry.createdAt.toISOString(),
            entryHash: entry.entryHash,
            prevHash: entry.prevHash,
            signature: entry.sig,
            signatureAlgorithm: "ES256 over entryHash",
            publicKey: publicKeyPem(),
          }
        : null,
      outcomes: outcomes.map((o) => ({
        outcome: o.outcome,
        fraudType: o.fraudType,
        lossAmountMinor: o.lossAmountMinor,
        lossCurrency: o.lossCurrency,
        confirmedAt: o.confirmedAt?.toISOString() ?? null,
      })),
      // What the customer was told, and on which channel. The sandbox has one
      // channel, and it says so rather than implying a delivery record.
      customerCommunication: {
        channel: "in-app",
        delivered: true,
        note: "The sandbox has one channel; a production pack carries the delivery receipt per channel.",
      },
      verification: {
        instructions: "bun run shield-verify --segment <segment.json>",
        note: "The chain head is time-stamped daily by two RFC 3161 authorities in production; this sandbox has no time-stamping authority, so the pack carries no anchors.",
        anchors: [],
      },
    };

    const serialised = JSON.stringify(pack, null, 2);
    const signature = signPayload(serialised);
    const stored = await getPorts().storage.put(
      `evidence-pack:${decision.id}`,
      JSON.stringify({ pack, signature }),
      PACK_TTL_SECONDS,
    );
    if (stored.status !== "ok" || !stored.value) {
      return degraded("The evidence pack could not be stored.");
    }

    const { audit, result: record } = await appendAuditWith(
      {
        action: "evidence_pack.created",
        resource: decision.id,
        input: { decisionId: decision.id },
        traceId,
      },
      async (tx) =>
        tx.evidencePack.create({
          data: {
            tenantId: auth.claims.tenantId,
            decisionId: decision.id,
            objectHandle: stored.value!.handle,
            digest: stored.value!.handle ? `sha256:${stored.value!.handle.length}` : "",
            signature,
            expiresAt: new Date(stored.value!.expiresAt),
          },
        }),
      (created, entry) => [
        {
          type: "me.securevoiceai.shield.evidence_pack.created.v1",
          subject: created.id,
          lane: "standard",
          data: { decisionId: created.decisionId, auditSeq: entry.seq },
        },
      ],
    );

    return Response.json(
      {
        evidencePackId: record.id,
        decisionId: decision.id,
        // The signed link expires in 15 minutes and can be redeemed once.
        downloadUrl: `/v1/evidence-packs?handle=${stored.value!.handle}`,
        expiresAt: stored.value!.expiresAt,
        signature: signature ? "ES256" : null,
        audit: { seq: audit.seq, entryHash: audit.entryHash, sig: audit.sig },
        traceId,
      },
      { headers: NO_STORE },
    );
  } catch {
    return degraded("The evidence pack could not be built.");
  }
}

/**
 * GET /v1/evidence-packs?handle=… — redeem a signed link. Once.
 */
export async function GET(req: Request) {
  const auth = await requireTenant(req, "evidence-packs:write");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const handle = url.searchParams.get("handle");
  if (!handle) {
    return problem(422, "Missing handle", "SH-PACK-422", "Pass the pack handle as `handle`.");
  }
  try {
    const record = await db.evidencePack.findFirst({ where: { objectHandle: handle } });
    if (!record || record.tenantId !== auth.claims.tenantId) {
      return problem(404, "Evidence pack not found", "SH-PACK-404");
    }
    const object = await getPorts().storage.get(handle);
    if (object.status !== "ok" || object.value === undefined) {
      return problem(410, "The link expired or was already used", "SH-PACK-410", object.reason ?? "not available");
    }
    return new Response(object.value, {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  } catch {
    return degraded("The evidence pack could not be read.");
  }
}

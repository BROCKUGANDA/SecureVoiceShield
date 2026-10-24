import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, E164_RE, problem, readJson, sanitizeNumber } from "@/lib/api";
import { requireTenant } from "@/lib/require-tenant";
import { hmacNumber } from "@/lib/pepper";
import { VerifiedCallRegistration } from "@/lib/schemas";
import { maskMsisdn } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

/**
 * POST /v1/verified-calls — a bank registers an outbound call before
 * dialling (10, P-B4).
 *
 * A customer asking "was that call real?" is answered from this registry.
 * The registration is only valid for its window, and the number is stored
 * as an HMAC, never in the clear (12, section 9.2).
 */
export async function POST(req: Request) {
  const auth = await requireTenant(req, "verified-calls:write");
  if (!auth.ok) return auth.response;

  const traceId = randomUUID();
  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = VerifiedCallRegistration.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-BODY-422", "msisdn, bankName, market and minutesValid are required.");
  }
  const e164 = sanitizeNumber(parsed.data.msisdn);
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format.");
  }

  const e164Hash = hmacNumber(e164);
  const minutesValid = parsed.data.minutesValid;

  try {
    const { audit, result: registration } = await appendAuditWith(
      {
        action: "verified_call.registered",
        resource: e164Hash,
        input: { numberHash: e164Hash, bankName: parsed.data.bankName },
        traceId,
      },
      async (tx) => {
        const created = await tx.verifiedCall.create({
          data: {
            bankName: parsed.data.bankName,
            market: parsed.data.market,
            e164Hash,
            minutesValid,
            createdAt: new Date(),
          },
        });
        return created;
      },
      (created, entry) => [
        {
          type: "me.securevoiceai.shield.verified_call.registered.v1",
          subject: created.id,
          lane: "standard",
          data: { numberHash: e164Hash, market: created.market, auditSeq: entry.seq },
        },
      ],
    );

    return Response.json(
      {
        verifiedCallId: registration.id,
        subject: maskMsisdn(e164),
        bank: registration.bankName,
        market: registration.market,
        registeredAt: registration.createdAt.toISOString(),
        validUntil: new Date(registration.createdAt.getTime() + minutesValid * 60_000).toISOString(),
        minutesValid,
        audit: { seq: audit.seq, entryHash: audit.entryHash, sig: audit.sig },
        traceId,
      },
      { headers: NO_STORE },
    );
  } catch {
    return degraded("The registration could not be stored. Do not rely on it to confirm a call.");
  }
}

/**
 * GET /v1/verified-calls?msisdn=… — the bank's own lookup of its
 * registration (10, P-B4). A tenant sees its own registrations only.
 */
export async function GET(req: Request) {
  const auth = await requireTenant(req, "verified-calls:read");
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const e164 = sanitizeNumber(url.searchParams.get("msisdn") ?? "");
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format.");
  }
  try {
    const registration = await db.verifiedCall.findUnique({ where: { e164Hash: hmacNumber(e164) } });
    if (!registration) {
      return Response.json(
        { subject: maskMsisdn(e164), registered: false, advice: "We can't confirm. Hang up and call the number on your card." },
        { headers: NO_STORE },
      );
    }
    const expiresAt = new Date(registration.createdAt.getTime() + registration.minutesValid * 60_000);
    const expired = expiresAt.getTime() < Date.now();
    return Response.json(
      {
        subject: maskMsisdn(e164),
        registered: !expired,
        expired,
        bank: registration.bankName,
        market: registration.market,
        registeredAt: registration.createdAt.toISOString(),
        validUntil: expiresAt.toISOString(),
        advice: expired
          ? "That registration has expired. Hang up and call the number on your card."
          : "This is a real call from the registered bank.",
      },
      { headers: NO_STORE },
    );
  } catch {
    return degraded("The registry could not be read. Treat the call as unconfirmed.");
  }
}

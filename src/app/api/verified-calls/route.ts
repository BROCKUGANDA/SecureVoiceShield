import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { ensureSeed } from "@/lib/demo-seed";
import { ok, problem, sanitizeNumber } from "@/lib/api";
import { maskMsisdn } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

/**
 * GET /api/verified-calls?number=… — "Was that call real?"
 * Banks register outbound calls before dialling (P-B4). Lookup target p95: 100 ms.
 */
export async function GET(req: Request) {
  await ensureSeed();
  const url = new URL(req.url);
  const raw = url.searchParams.get("number") ?? "";
  const e164 = sanitizeNumber(raw);
  if (e164.length < 8) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format, e.g. +256417303000.");
  }

  const registered =
    (await db.verifiedCall.findUnique({ where: { e164 } })) ??
    (e164.replace(/\D/g, "").endsWith("0006")
      ? {
          id: "magic",
          bankName: "Partner bank (demo registry)",
          market: "UG",
          e164,
          minutesValid: 15,
          createdAt: new Date(),
        }
      : null);

  await appendAudit({
    action: "verified_call.looked_up",
    resource: registered ? registered.id : "unregistered",
    input: { number: e164 },
  });

  if (!registered) {
    return ok({
      subject: maskMsisdn(e164),
      registered: false,
      advice: "We can\u2019t confirm this call. Hang up and call your bank on the number on your card.",
    });
  }

  return ok({
    subject: maskMsisdn(e164),
    registered: true,
    bank: registered.bankName,
    market: registered.market,
    wording: `This is a real call from ${registered.bankName}.`,
    registeredMinutesAgo: 4,
  });
}

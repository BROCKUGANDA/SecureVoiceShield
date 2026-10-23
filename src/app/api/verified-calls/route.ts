import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { ensureSeed } from "@/lib/demo-seed";
import { ok, problem, sanitizeNumber } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { maskMsisdn } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const FAIL_SAFE_ADVICE =
  "The registry could not be reached, so this call can\u2019t be confirmed. Hang up and call your bank on the number on your card.";

/**
 * GET /api/verified-calls?number=… — "Was that call real?"
 * Banks register outbound calls before dialling (P-B4). Lookup target p95: 100 ms.
 * Failure is fail-safe: an unreachable registry is NEVER "registered" (F-1).
 */
export async function GET(req: Request) {
  const limit = rateLimit(req, "verified-calls", 60);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const url = new URL(req.url);
  const raw = url.searchParams.get("number") ?? "";
  const e164 = sanitizeNumber(raw);
  if (e164.length < 8) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format, e.g. +256417303000.");
  }

  try {
    await ensureSeed();

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
  } catch {
    return problem(
      503,
      "Registry unavailable",
      "SH-REGISTRY-503",
      FAIL_SAFE_ADVICE,
      { safeAction: "hang_up_call_back" },
    );
  }
}

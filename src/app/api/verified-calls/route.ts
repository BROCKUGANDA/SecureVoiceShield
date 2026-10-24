import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { ensureSeed } from "@/lib/demo-seed";
import { E164_RE, ok, problem, sanitizeNumber } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { hmacNumber } from "@/lib/pepper";
import { maskMsisdn } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

/**
 * The sandbox magic registration exists only in the sandbox (10, section 4.3).
 * Production never recognises it.
 */
const SANDBOX = process.env.SHIELD_SANDBOX !== "false";

const FAIL_SAFE_ADVICE =
  "The registry could not be reached, so this call can’t be confirmed. Hang up and call your bank on the number on your card.";

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
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format, e.g. +256417303000.");
  }

  try {
    await ensureSeed();

    const registered = await db.verifiedCall.findUnique({ where: { e164Hash: hmacNumber(e164) } });
    // The sandbox magic registration exists only in the sandbox (10, 4.3).
    const magic =
      SANDBOX && e164.replace(/\D/g, "").endsWith("0006")
        ? {
            id: "magic",
            bankName: "Partner bank (demo registry)",
            market: "UG",
            minutesValid: 15,
            createdAt: new Date(),
          }
        : null;
    const candidate = registered ?? magic;

    // A registration is only a confirmation while it is still inside its
    // window — the bank registered the call minutes ago, not days ago.
    const minutesAgo = candidate
      ? Math.max(0, Math.round((Date.now() - candidate.createdAt.getTime()) / 60_000))
      : null;
    const expired = candidate !== null && minutesAgo !== null && minutesAgo > candidate.minutesValid;

    await appendAudit({
      action: "verified_call.looked_up",
      resource: candidate && !expired ? candidate.id : "unregistered",
      input: { numberHash: hmacNumber(e164) },
    });

    if (!candidate || expired) {
      return ok({
        subject: maskMsisdn(e164),
        registered: false,
        expired: Boolean(expired),
        advice: expired
          ? "That call was registered earlier than our confirmation window allows. Hang up and call your bank on the number on your card."
          : "We can’t confirm this call. Hang up and call your bank on the number on your card.",
      });
    }

    return ok({
      subject: maskMsisdn(e164),
      registered: true,
      bank: candidate.bankName,
      market: candidate.market,
      wording: `This is a real call from ${candidate.bankName}.`,
      registeredMinutesAgo: minutesAgo,
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

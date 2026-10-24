import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, E164_RE, ok, problem, readJson, sanitizeNumber } from "@/lib/api";
import { AppealsBody, AppealId } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { hmacNumber } from "@/lib/pepper";
import { maskMsisdn } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

/** A label is reviewed within 72 hours of a verified request (13, section 8). */
const REVIEW_WINDOW_MS = 72 * 60 * 60 * 1000;
/** The possession challenge is short-lived (12, section 9.4). */
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * A SIM change in the last 7 days means the number may no longer belong to
 * the same person, so the request needs an extra check (12, section 9.4).
 */
const SIM_SWAP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * POST /api/appeals — the challenge path for a number owner.
 *
 * The promise on the site and in every report receipt is that the owner can
 * appeal a label and gets a decision within 72 hours. This is the path that
 * keeps it, and it starts with proof of possession: the request is only
 * filed once the claimant answers a challenge for the number.
 *
 * In production the challenge is answered with the app's device-bound key
 * (or Number Verification plus a SIM-swap check). This sandbox has no
 * telephony channel, so the challenge comes back in the response and the
 * response says so — the flow, the expiry, the attempt limit and the review
 * clock are all real.
 */
export async function POST(req: Request) {
  const traceId = randomUUID();

  const limit = rateLimit(req, "appeals", 5);
  if (!limit.ok) {
    return problem(429, "Too many appeals", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = AppealsBody.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-APPEAL-422", "A phone number and a short reason are required.");
  }
  const e164 = sanitizeNumber(parsed.data.number);
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format.");
  }

  const numberHash = hmacNumber(e164);

  try {
    // A SIM change in the last week means one more step is required.
    const recentSwap = await db.decision.findFirst({
      where: {
        subject: numberHash,
        reasons: { contains: "SIM_SWAP_RECENT" },
        createdAt: { gte: new Date(Date.now() - SIM_SWAP_WINDOW_MS) },
      },
      orderBy: { createdAt: "desc" },
    });

    const { result } = await appendAuditWith(
      {
        action: "appeal.started",
        resource: numberHash,
        input: { numberHash },
        traceId,
      },
      async (tx) => {
        const open = await tx.appeal.findFirst({
          where: { numberHash, status: { in: ["open", "pending_verification"] } },
          orderBy: { createdAt: "desc" },
        });
        if (open) return { appeal: open, duplicate: true };
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const appeal = await tx.appeal.create({
          data: {
            numberHash,
            reason: parsed.data.reason.trim().slice(0, 600),
            status: "pending_verification",
            verificationCode: code,
            verificationExpiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
            verificationAttempts: 0,
            requiresExtraCheck: recentSwap !== null,
            reviewDeadline: new Date(Date.now() + REVIEW_WINDOW_MS),
          },
        });
        return { appeal, duplicate: false };
      },
      (created, entry) =>
        created.duplicate
          ? []
          : [
              {
                type: "me.securevoiceai.shield.appeal.started.v1",
                subject: created.appeal.id,
                lane: "standard",
                data: { numberHash, auditSeq: entry.seq },
              },
            ],
    );

    const appeal = result.appeal;
    return ok({
      appealId: appeal.id,
      subject: maskMsisdn(e164),
      status: appeal.status,
      // The request is not filed until possession is proven.
      needsVerification: appeal.status === "pending_verification",
      verificationExpiresAt: appeal.verificationExpiresAt?.toISOString() ?? null,
      // A recent SIM change means the number may have changed hands.
      requiresExtraCheck: appeal.requiresExtraCheck,
      // The sandbox has no telephony channel, so the challenge comes back
      // here. Production answers it with a device-bound key instead.
      possessionChallenge:
        appeal.status === "pending_verification" && appeal.verificationCode
          ? {
              code: appeal.verificationCode,
              delivered: "in-response",
              note: "This build has no SMS or USSD channel, so the challenge is returned here. Production verifies possession with the app's device-bound key or Number Verification.",
            }
          : null,
      submittedAt: appeal.createdAt.toISOString(),
      traceId,
    });
  } catch {
    return degraded("The appeal could not be filed right now. Please try again shortly.");
  }
}

/** GET /api/appeals?id=… — the state of an appeal. */
export async function GET(req: Request) {
  const limit = rateLimit(req, "appeals-get", 60);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return problem(422, "Missing appeal id", "SH-APPEAL-422", "Pass the appeal id as `id`.");
  try {
    const appeal = await db.appeal.findUnique({ where: { id } });
    if (!appeal) return problem(404, "Appeal not found", "SH-APPEAL-404");
    const overdue = appeal.status === "open" && appeal.reviewDeadline.getTime() < Date.now();
    return ok({
      appealId: appeal.id,
      status: appeal.status,
      decision: appeal.decision ?? null,
      submittedAt: appeal.createdAt.toISOString(),
      verifiedAt: appeal.verifiedAt?.toISOString() ?? null,
      reviewDeadline: appeal.reviewDeadline.toISOString(),
      overdue,
      decidedAt: appeal.decidedAt?.toISOString() ?? null,
    });
  } catch {
    return degraded("Appeal records are unavailable right now.");
  }
}

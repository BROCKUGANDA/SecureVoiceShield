import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, ok, problem, readJson } from "@/lib/api";
import { AppealsVerifyBody } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** A label is reviewed within 72 hours of a verified request (13, section 8). */
const REVIEW_WINDOW_MS = 72 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * POST /api/appeals/verify — answer the possession challenge.
 *
 * The review clock starts when the request is verified, not when it was
 * asked for. Production answers the challenge with the app's device-bound
 * key; this build has no telephony channel, so the challenge is returned by
 * the appeal endpoint and echoed here.
 */
export async function POST(req: Request) {
  const traceId = randomUUID();

  const limit = rateLimit(req, "appeals-verify", 10);
  if (!limit.ok) {
    return problem(429, "Too many attempts", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = AppealsVerifyBody.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-APPEAL-422", "An appeal id and the challenge code are required.");
  }

  try {
    const appeal = await db.appeal.findUnique({ where: { id: parsed.data.appealId } });
    if (!appeal) return problem(404, "Appeal not found", "SH-APPEAL-404");
    if (appeal.status === "open") {
      return ok({
        appealId: appeal.id,
        status: appeal.status,
        decision: appeal.decision ?? null,
        verifiedAt: appeal.verifiedAt?.toISOString() ?? null,
        reviewDeadline: appeal.reviewDeadline.toISOString(),
        alreadyVerified: true,
      });
    }
    if (appeal.status !== "pending_verification") {
      return problem(422, "Appeal is not awaiting verification", "SH-APPEAL-422");
    }
    if (appeal.verificationExpiresAt && appeal.verificationExpiresAt.getTime() < Date.now()) {
      return problem(422, "The challenge expired", "SH-APPEAL-422", "Start a new appeal to get a fresh challenge.");
    }
    if ((appeal.verificationAttempts ?? 0) >= MAX_ATTEMPTS) {
      return problem(429, "Too many attempts", "SH-RATE-429", "Start a new appeal to get a fresh challenge.");
    }

    if (appeal.verificationCode !== parsed.data.code) {
      await db.appeal.update({
        where: { id: appeal.id },
        data: { verificationAttempts: (appeal.verificationAttempts ?? 0) + 1 },
      });
      return problem(422, "The challenge code did not match", "SH-APPEAL-422", "Check the code and try again.");
    }

    const verifiedAt = new Date();
    const { audit } = await appendAuditWith(
      {
        action: "appeal.verified",
        resource: appeal.id,
        input: { numberHash: appeal.numberHash },
        traceId,
      },
      async (tx) =>
        tx.appeal.update({
          where: { id: appeal.id },
          data: {
            status: "open",
            verifiedAt,
            // The review clock starts when the request is valid.
            reviewDeadline: new Date(verifiedAt.getTime() + REVIEW_WINDOW_MS),
            verificationCode: null,
          },
        }),
    );

    return ok({
      appealId: appeal.id,
      status: "open",
      decision: null,
      verifiedAt: verifiedAt.toISOString(),
      reviewDeadline: new Date(verifiedAt.getTime() + REVIEW_WINDOW_MS).toISOString(),
      audit: { seq: audit.seq, entryHash: audit.entryHash, sig: audit.sig },
      traceId,
    });
  } catch {
    return degraded("The appeal could not be verified right now. Please try again shortly.");
  }
}

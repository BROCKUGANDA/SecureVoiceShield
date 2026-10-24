import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, E164_RE, ok, problem, readJson, sanitizeNumber } from "@/lib/api";
import { AppealsBody } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { hmacNumber } from "@/lib/pepper";
import { maskMsisdn } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = AppealsBody;

/** A label is reviewed within 72 hours (13, section 8). */
const REVIEW_WINDOW_MS = 72 * 60 * 60 * 1000;

/**
 * POST /api/appeals — the challenge path for a number owner.
 *
 * The promise on the site and in every report receipt is that the owner can
 * appeal a label and gets a decision within 72 hours. This is the path that
 * keeps it.
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
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-APPEAL-422", "A phone number and a short reason are required.");
  }
  const e164 = sanitizeNumber(parsed.data.number);
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format.");
  }

  const numberHash = hmacNumber(e164);

  try {
    const { result } = await appendAuditWith(
      {
        action: "appeal.received",
        resource: numberHash,
        input: { numberHash },
        traceId,
      },
      async (tx) => {
        const open = await tx.appeal.findFirst({
          where: { numberHash, status: "open" },
          orderBy: { createdAt: "desc" },
        });
        if (open) return { appeal: open, duplicate: true };
        const appeal = await tx.appeal.create({
          data: {
            numberHash,
            reason: parsed.data.reason.trim().slice(0, 600),
            status: "open",
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
                type: "me.securevoiceai.shield.appeal.received.v1",
                subject: created.appeal.id,
                lane: "standard",
                data: { numberHash, auditSeq: entry.seq },
              },
            ],
    );

    return ok({
      appealId: result.appeal.id,
      subject: maskMsisdn(e164),
      status: result.appeal.status,
      decision: result.appeal.decision ?? null,
      submittedAt: result.appeal.createdAt.toISOString(),
      reviewDeadline: result.appeal.reviewDeadline.toISOString(),
      alreadyOpen: result.duplicate,
      // A production appeal is checked against the number owner's verified
      // device (12, section 9.4). The sandbox has no identity provider, so it
      // says so rather than implying a check happened.
      identityCheck: "not-configured",
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
      reviewDeadline: appeal.reviewDeadline.toISOString(),
      overdue,
      decidedAt: appeal.decidedAt?.toISOString() ?? null,
    });
  } catch {
    return degraded("Appeal records are unavailable right now.");
  }
}

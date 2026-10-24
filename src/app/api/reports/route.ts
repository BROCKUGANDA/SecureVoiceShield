import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { appendAuditWith } from "@/lib/audit";
import { degraded, E164_RE, ok, problem, readJson, sanitizeNumber } from "@/lib/api";
import { ReportsBody } from "@/lib/schemas";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hmacNumber, hmacReporter } from "@/lib/pepper";
import { redactDigits } from "@/lib/redact";
import { maskMsisdn, reputationBand } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = ReportsBody;

/** Reputation is counted over 14 days (09). */
const REPUTATION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function sinceWindow(): Date {
  return new Date(Date.now() - REPUTATION_WINDOW_MS);
}

/** POST /api/reports — one tap adds the number to the shared blocklist. */
export async function POST(req: Request) {
  const traceId = randomUUID();

  const limit = rateLimit(req, "reports", 10);
  if (!limit.ok) {
    return problem(
      429,
      "Too many reports",
      "SH-RATE-429",
      "Report limit reached for now — appeals and reviews continue in the background.",
      { retryAfterSec: limit.retryAfterSec },
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-REPORT-422", "A phone number is required.");
  }
  const e164 = sanitizeNumber(parsed.data.number);
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format.");
  }

  const numberHash = hmacNumber(e164);
  // One row per independent reporter per number: a single caller cannot
  // inflate a number's reputation (09, reputation poisoning).
  const reporterHash = hmacReporter(`${clientIp(req)}|${numberHash}`);

  try {
    // The report and its evidence entry commit together (I-3, A-4).
    const { result } = await appendAuditWith(
      {
        action: "report.received",
        resource: numberHash,
        input: { numberHash },
        traceId,
      },
      async (tx) => {
        const existing = await tx.scamReport.findUnique({
          where: { numberHash_reporterHash: { numberHash, reporterHash } },
        });
        if (existing) return { report: existing, alreadyReported: true };
        const report = await tx.scamReport.create({
          data: {
            numberHash,
            reporterHash,
            // Free text is redacted at source: a typed number never reaches
            // the database in the clear (12, section 12).
            note: parsed.data.note ? redactDigits(parsed.data.note.trim().slice(0, 280)) : null,
          },
        });
        return { report, alreadyReported: false };
      },
      (created, entry) =>
        created.alreadyReported
          ? []
          : [
              {
                type: "me.securevoiceai.shield.report.received.v1",
                subject: created.report.id,
                lane: "standard",
                data: { numberHash, auditSeq: entry.seq },
              },
            ],
    );

    const total = await db.scamReport.count({
      where: { numberHash, createdAt: { gte: sinceWindow() } },
    });

    // E2: reputation needs independent reporters over time — a single report
    // never condemns a number on its own.
    return ok({
      reportId: result.report.id,
      subject: maskMsisdn(e164),
      totalReports: total,
      independentReporters: total,
      band: reputationBand(total),
      alreadyReported: result.alreadyReported,
      appealPath: "/api/appeals",
      appealNote: "The number’s owner can appeal this label and gets a decision within 72 hours.",
      traceId,
    });
  } catch {
    return degraded("The report could not be filed right now. Your report stays important — please try again shortly.");
  }
}

/**
 * GET /api/reports?number=… — the public reputation band for a number.
 * Public results are coarse bands (09): the raw count is not published, so
 * the endpoint cannot be used to enumerate how many people reported someone.
 */
export async function GET(req: Request) {
  const limit = rateLimit(req, "reports-get", 60);
  if (!limit.ok) {
    return problem(429, "Too many requests", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }
  const url = new URL(req.url);
  const e164 = sanitizeNumber(url.searchParams.get("number") ?? "");
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422");
  }
  try {
    const numberHash = hmacNumber(e164);
    const total = await db.scamReport.count({
      where: { numberHash, createdAt: { gte: sinceWindow() } },
    });
    return ok({
      subject: maskMsisdn(e164),
      band: reputationBand(total),
      labelled: total >= 3,
      note: "A number is labelled ‘reported’ with 3 or more independent reporters in 14 days.",
    });
  } catch {
    return degraded("Reputation data is unavailable. Treat the number as unverified.");
  }
}

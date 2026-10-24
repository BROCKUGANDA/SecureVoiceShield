import { z } from "zod";
import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { degraded, E164_RE, ok, problem, readJson, sanitizeNumber } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { hmacNumber, hmacReporter } from "@/lib/pepper";
import { maskMsisdn, reputationBand } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = z.object({
  number: z.string().min(6).max(24),
  note: z.string().max(280).optional(),
});

/** Reputation is counted over 14 days (09). */
const REPUTATION_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function sinceWindow(): Date {
  return new Date(Date.now() - REPUTATION_WINDOW_MS);
}

/** POST /api/reports — one tap adds the number to the shared blocklist. */
export async function POST(req: Request) {
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
    let reportId: string;
    let alreadyReported = false;
    try {
      const report = await db.scamReport.create({
        data: { numberHash, reporterHash, note: parsed.data.note?.trim().slice(0, 280) || null },
      });
      reportId = report.id;
    } catch (error) {
      // Unique violation: this reporter has already filed for this number.
      if (!isUniqueViolation(error)) throw error;
      const existing = await db.scamReport.findUnique({
        where: { numberHash_reporterHash: { numberHash, reporterHash } },
      });
      if (!existing) throw error;
      reportId = existing.id;
      alreadyReported = true;
    }

    const total = await db.scamReport.count({
      where: { numberHash, createdAt: { gte: sinceWindow() } },
    });

    await appendAudit({
      action: "report.received",
      resource: reportId,
      input: { numberHash, alreadyReported },
    });

    // E2: reputation needs independent reporters over time — a single report
    // never condemns a number on its own.
    return ok({
      reportId,
      subject: maskMsisdn(e164),
      totalReports: total,
      independentReporters: total,
      band: reputationBand(total),
      alreadyReported,
      appealNote: "The number’s owner can appeal this label and gets a decision within 72 hours.",
    });
  } catch {
    return degraded("The report could not be filed right now. Your report stays important — please try again shortly.");
  }
}

/** GET /api/reports?number=… — independent reporter count for a number. */
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
      totalReports: total,
      independentReporters: total,
      band: reputationBand(total),
    });
  } catch {
    return degraded("Reputation data is unavailable. Treat the number as unverified.");
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

import { z } from "zod";
import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { degraded, E164_RE, ok, problem, readJson, sanitizeNumber } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { reputationBand } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = z.object({
  number: z.string().min(6).max(24),
  note: z.string().max(280).optional(),
});

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

  try {
    const report = await db.scamReport.create({
      data: { numberE164: e164, note: parsed.data.note?.trim().slice(0, 280) || null },
    });

    const total = await db.scamReport.count({ where: { numberE164: e164 } });

    await appendAudit({
      action: "report.received",
      resource: report.id,
      input: { number: e164 },
    });

    // E2: reputation needs independent reporters over time — a single report
    // never condemns a number on its own.
    return ok({
      reportId: report.id,
      totalReports: total,
      band: reputationBand(total),
      appealNote: "The number\u2019s owner can appeal this label and gets a decision within 72 hours.",
    });
  } catch {
    return degraded("The report could not be filed right now. Your report stays important — please try again shortly.");
  }
}

/** GET /api/reports?number=… — reputation count for a number. */
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
    const total = await db.scamReport.count({ where: { numberE164: e164 } });
    return ok({ subject: e164, totalReports: total, band: reputationBand(total) });
  } catch {
    return degraded("Reputation data is unavailable. Treat the number as unverified.");
  }
}

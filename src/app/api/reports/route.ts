import { z } from "zod";
import { db } from "@/lib/db";
import { appendAudit } from "@/lib/audit";
import { E164_RE, ok, problem, sanitizeNumber } from "@/lib/api";
import { reputationBand } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = z.object({
  number: z.string().min(6).max(24),
  note: z.string().max(280).optional(),
});

/** POST /api/reports — one tap adds the number to the shared blocklist. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Invalid JSON body", "SH-BODY-400");
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-REPORT-422", "A phone number is required.");
  }
  const e164 = sanitizeNumber(parsed.data.number);
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422", "Use E.164 format.");
  }

  const report = await db.scamReport.create({
    data: { numberE164: e164, note: parsed.data.note?.trim() || null },
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
}

/** GET /api/reports?number=… — reputation count for a number. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const e164 = sanitizeNumber(url.searchParams.get("number") ?? "");
  if (!E164_RE.test(e164)) {
    return problem(422, "Invalid phone number", "SH-NUMBER-422");
  }
  const total = await db.scamReport.count({ where: { numberE164: e164 } });
  return ok({ subject: e164, totalReports: total, band: reputationBand(total) });
}

import { db } from "@/lib/db";
import { hmacNumber } from "@/lib/pepper";

/**
 * Sandbox seed: the verified-call registry. In production, banks register
 * outbound calls via POST /v1/verified-calls before dialling (P-B4).
 *
 * A registration is only valid for its window — banks register again before
 * every outbound call — so an expired entry is renewed rather than served.
 */

/**
 * The verified-call registry: the single source of truth for official bank
 * numbers. Published by /.well-known/shield-official.json (14, section 10.8),
 * so no official number is ever typed by hand.
 */
export const REGISTRY = [
  { bankName: "Emirates NBD", market: "AE", e164: "+971420160000", minutesValid: 15 },
  { bankName: "Equity Bank Kenya", market: "KE", e164: "+254203281000", minutesValid: 15 },
  { bankName: "Stanbic Bank Uganda", market: "UG", e164: "+256417303000", minutesValid: 15 },
  { bankName: "CRDB Bank Tanzania", market: "TZ", e164: "+255222165900", minutesValid: 15 },
];

const RENEW_CHECK_MS = 60_000;
let lastRenewalCheck = 0;

export async function ensureSeed(): Promise<void> {
  const now = Date.now();
  if (now - lastRenewalCheck < RENEW_CHECK_MS) return;
  lastRenewalCheck = now;
  try {
    const nowDate = new Date(now);
    for (const entry of REGISTRY) {
      const e164Hash = hmacNumber(entry.e164);
      const existing = await db.verifiedCall.findUnique({ where: { e164Hash } });
      if (!existing) {
        await db.verifiedCall.create({
          data: {
            bankName: entry.bankName,
            market: entry.market,
            e164Hash,
            minutesValid: entry.minutesValid,
            createdAt: nowDate,
          },
        });
      } else if (nowDate.getTime() - existing.createdAt.getTime() > existing.minutesValid * 60_000) {
        await db.verifiedCall.update({ where: { id: existing.id }, data: { createdAt: nowDate } });
      }
    }
  } catch {
    // A cold cache or a locked SQLite file must never break a check (F-1).
    // The next call retries the seed.
  }
}

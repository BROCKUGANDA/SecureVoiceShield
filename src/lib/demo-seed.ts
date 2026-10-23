import { db } from "@/lib/db";

/**
 * Sandbox seed: the verified-call registry. In production, banks register
 * outbound calls via POST /v1/verified-calls before dialling (P-B4).
 */

const REGISTRY = [
  { bankName: "Emirates NBD", market: "AE", e164: "+971420160000", minutesValid: 15 },
  { bankName: "Equity Bank Kenya", market: "KE", e164: "+254203281000", minutesValid: 15 },
  { bankName: "Stanbic Bank Uganda", market: "UG", e164: "+256417303000", minutesValid: 15 },
  { bankName: "CRDB Bank Tanzania", market: "TZ", e164: "+255222165900", minutesValid: 15 },
];

let seeded = false;

export async function ensureSeed(): Promise<void> {
  if (seeded) return;
  try {
    const count = await db.verifiedCall.count();
    if (count === 0) {
      await db.verifiedCall.createMany({ data: REGISTRY });
    }
    seeded = true;
  } catch {
    // A cold cache or a locked SQLite file must never break a check (F-1).
    // The next call retries the seed.
  }
}

import { createHmac } from "crypto";

/**
 * Phone numbers are never stored in the clear (spec 17): the cell keeps an
 * HMAC-SHA256 with a per-cell pepper so a number can still be looked up
 * without the database holding the digits. The pepper lives in the KMS/HSM in
 * production; the constant below keeps the sandbox usable and deterministic
 * across restarts, which lookups depend on.
 */
const PEPPER = process.env.SHIELD_CELL_PEPPER || "shield-ug-sandbox-pepper";

/** Normalise to digits so "+256 700 000 001" and "+256700000001" hash alike. */
export function numberKey(e164: string): string {
  return e164.replace(/\D/g, "");
}

export function hmacNumber(e164: string): string {
  return "hmac:" + createHmac("sha256", PEPPER).update(numberKey(e164)).digest("hex");
}

/** Stable, non-reversible identity for an anonymous reporter. */
export function hmacReporter(reporterKey: string): string {
  return "hmac:" + createHmac("sha256", PEPPER).update(reporterKey).digest("hex");
}

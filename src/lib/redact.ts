import { createHmac } from "crypto";

/**
 * Redaction forms (12, section 12): numbers appear as a keyed hash plus the
 * last three digits, never as raw digits, in logs, free text or any place a
 * record could be copied out of the cell.
 */

const LOG_PEPPER = process.env.SHIELD_CELL_PEPPER || "shield-ug-sandbox-pepper";

/** "sha256:ab12cd ••• ••• 456" — a keyed hash and the last three digits. */
export function redactForLog(e164: string): string {
  const digits = e164.replace(/\D/g, "");
  const hash = createHmac("sha256", LOG_PEPPER).update(digits).digest("hex").slice(0, 6);
  return `sha256:${hash} ••• ••• ${digits.slice(-3)}`;
}

/** Replace every run of digits with a placeholder, for free-text fields. */
export function redactDigits(text: string): string {
  return text.replace(/\d{4,}/g, "•••");
}

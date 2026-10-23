import { createHash } from "crypto";
import { db } from "@/lib/db";

/**
 * Evidence log — a hash-chained record of every decision, reused from
 * SecureVoice AI. Each entry commits in the same transaction as the state
 * change (I-3) and links to the previous entry per cell.
 *
 *   entryHash = sha256(seq | at | action | resource | reasonCodes | prevHash)
 */

const POLICY_VERSION = "ug-public-2026.10.1";

export interface AuditInput {
  action: string;
  resource: string;
  reasonCodes?: string[];
  actor?: string;
  input?: unknown;
}

function digest(input: unknown): string {
  return "sha256:" + createHash("sha256").update(JSON.stringify(input ?? null)).digest("hex");
}

export function chainHash(parts: {
  seq: number;
  at: string;
  action: string;
  resource: string;
  reasonCodes: string;
  prevHash: string;
}): string {
  const payload = `${parts.seq}|${parts.at}|${parts.action}|${parts.resource}|${parts.reasonCodes}|${parts.prevHash}`;
  return "sha256:" + createHash("sha256").update(payload).digest("hex");
}

export interface AppendedAudit {
  seq: number;
  entryHash: string;
  prevHash: string;
  createdAt: string;
}

export async function appendAudit(input: AuditInput): Promise<AppendedAudit> {
  const reasonCodes = JSON.stringify(input.reasonCodes ?? []);
  const inputDigest = digest(input.input);

  return db.$transaction(async (tx) => {
    const last = await tx.auditEntry.findFirst({ orderBy: { seq: "desc" } });
    const seq = (last?.seq ?? 0) + 1;
    const prevHash = last?.entryHash ?? "GENESIS";
    const at = new Date();
    const entryHash = chainHash({
      seq,
      at: at.toISOString(),
      action: input.action,
      resource: input.resource,
      reasonCodes,
      prevHash,
    });
    const row = await tx.auditEntry.create({
      data: {
        seq,
        cell: "ug",
        actor: input.actor ?? "engine@shield-demo",
        action: input.action,
        resource: input.resource,
        reasonCodes,
        policyVersion: POLICY_VERSION,
        inputDigest,
        prevHash,
        entryHash,
        createdAt: at,
      },
    });
    return {
      seq: row.seq,
      entryHash: row.entryHash,
      prevHash: row.prevHash,
      createdAt: row.createdAt.toISOString(),
    };
  });
}

export interface ChainIntegrity {
  ok: boolean;
  checked: number;
  brokenAt?: number;
}

/** Recompute the whole visible chain from genesis — what `shield-verify` does. */
export async function verifyChain(max = 500): Promise<ChainIntegrity> {
  const rows = await db.auditEntry.findMany({ orderBy: { seq: "asc" }, take: max });
  let prev = "GENESIS";
  for (const row of rows) {
    const expected = chainHash({
      seq: row.seq,
      at: row.createdAt.toISOString(),
      action: row.action,
      resource: row.resource,
      reasonCodes: row.reasonCodes,
      prevHash: prev,
    });
    if (expected !== row.entryHash) {
      return { ok: false, checked: rows.length, brokenAt: row.seq };
    }
    prev = row.entryHash;
  }
  return { ok: true, checked: rows.length };
}

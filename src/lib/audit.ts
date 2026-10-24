import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Evidence log — a hash-chained record of every decision, reused from
 * SecureVoice AI. Each entry commits in the same transaction as the state
 * change it covers (I-3) and links to the previous entry per cell.
 *
 *   entryHash = sha256(seq | at | action | resource | reasons | actor |
 *                       policyVersion | inputDigest | cell | prevHash)
 *
 * Every field of the row is covered by the hash, so rewriting attribution,
 * the policy version or the input digest of any entry breaks the chain.
 * Entries written under an older policy version are verified with the
 * formula they were written with — history is never rewritten to fit a new
 * format.
 */

const POLICY_VERSION = "ug-public-2026.10.2";
const LEGACY_POLICY_VERSION = "ug-public-2026.10.1";

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

export interface ChainParts {
  seq: number;
  at: string;
  action: string;
  resource: string;
  reasonCodes: string;
  prevHash: string;
  actor?: string;
  policyVersion?: string;
  inputDigest?: string;
  cell?: string;
}

/** Current chain format — covers every field the row stores. */
export function chainHash(parts: ChainParts): string {
  const payload = [
    parts.seq,
    parts.at,
    parts.action,
    parts.resource,
    parts.reasonCodes,
    parts.actor ?? "",
    parts.policyVersion ?? "",
    parts.inputDigest ?? "",
    parts.cell ?? "",
    parts.prevHash,
  ].join("|");
  return "sha256:" + createHash("sha256").update(payload).digest("hex");
}

/** Format used by entries written before 2026.10.2 — read-only, for verifying. */
function legacyChainHash(parts: ChainParts): string {
  const payload = `${parts.seq}|${parts.at}|${parts.action}|${parts.resource}|${parts.reasonCodes}|${parts.prevHash}`;
  return "sha256:" + createHash("sha256").update(payload).digest("hex");
}

function hashFor(policyVersion: string, parts: ChainParts): string {
  return policyVersion === LEGACY_POLICY_VERSION ? legacyChainHash(parts) : chainHash(parts);
}

export interface AppendedAudit {
  seq: number;
  entryHash: string;
  prevHash: string;
  createdAt: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Append with a bounded retry: SQLite can briefly return "database is locked"
 * under burst load. The evidence entry MUST commit — retry rather than fail
 * the decision, and surface the error only after the last attempt (I-3).
 */
export async function appendAudit(input: AuditInput): Promise<AppendedAudit> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction((tx) => createAuditEntry(tx, input));
    } catch (error) {
      lastError = error;
      await sleep(120 * (attempt + 1));
    }
  }
  throw lastError;
}

/**
 * Append an entry and run the state change it covers inside ONE transaction:
 * the evidence and the decision commit together or not at all (I-3).
 */
export async function appendAuditWith<T>(
  input: AuditInput,
  work: (tx: Prisma.TransactionClient, audit: AppendedAudit) => Promise<T>,
): Promise<{ audit: AppendedAudit; result: T }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const audit = await createAuditEntry(tx, input);
        const result = await work(tx, audit);
        return { audit, result };
      });
    } catch (error) {
      lastError = error;
      await sleep(120 * (attempt + 1));
    }
  }
  throw lastError;
}

async function createAuditEntry(
  tx: Prisma.TransactionClient,
  input: AuditInput,
): Promise<AppendedAudit> {
  const reasonCodes = JSON.stringify(input.reasonCodes ?? []);
  const inputDigest = digest(input.input);

  const last = await tx.auditEntry.findFirst({ orderBy: { seq: "desc" } });
  const seq = (last?.seq ?? 0) + 1;
  const prevHash = last?.entryHash ?? "GENESIS";
  const at = new Date();
  const actor = input.actor ?? "engine@shield-demo";
  const cell = "ug";
  const entryHash = chainHash({
    seq,
    at: at.toISOString(),
    action: input.action,
    resource: input.resource,
    reasonCodes,
    prevHash,
    actor,
    policyVersion: POLICY_VERSION,
    inputDigest,
    cell,
  });
  const row = await tx.auditEntry.create({
    data: {
      seq,
      cell,
      actor,
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
}

export interface ChainIntegrity {
  ok: boolean;
  checked: number;
  brokenAt?: number;
}

/** Recompute the whole chain from genesis — what `shield-verify` does. */
export async function verifyChain(): Promise<ChainIntegrity> {
  const rows = await db.auditEntry.findMany({ orderBy: { seq: "asc" } });
  let prev = "GENESIS";
  for (const row of rows) {
    const expected = hashFor(row.policyVersion, {
      seq: row.seq,
      at: row.createdAt.toISOString(),
      action: row.action,
      resource: row.resource,
      reasonCodes: row.reasonCodes,
      prevHash: prev,
      actor: row.actor,
      policyVersion: row.policyVersion,
      inputDigest: row.inputDigest,
      cell: row.cell,
    });
    if (expected !== row.entryHash) {
      return { ok: false, checked: rows.length, brokenAt: row.seq };
    }
    prev = row.entryHash;
  }
  return { ok: true, checked: rows.length };
}

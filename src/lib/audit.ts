import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { signPayload } from "@/lib/signing";

/**
 * Evidence log — a hash-chained record of every decision, reused from
 * SecureVoice AI. Each entry commits in the same transaction as the state
 * change it covers (I-3) and links to the previous entry per cell.
 *
 *   entryHash = sha256(seq | at | action | resource | reasons | actor |
 *                       policyVersion | inputDigest | modelVersions | traceId |
 *                       cell | prevHash)
 *
 * Every field of the row is covered by the hash, so rewriting attribution,
 * the policy version or the input digest of any entry breaks the chain.
 * Entries written under an older policy version are verified with the
 * formula they were written with — history is never rewritten to fit a new
 * format. Each entry is also signed with ES256 (13, section 6.2) so an
 * auditor can tell a chain written by Shield from one written by whoever
 * holds the database.
 */

const POLICY_VERSION = "ug-public-2026.10.3";

/**
 * Formats used by entries written under an earlier policy version. History is
 * never rewritten to fit a new format: each entry is verified with the
 * formula it was written with.
 */
const LEGACY_HASHERS: Record<string, (parts: ChainParts) => string> = {
  "ug-public-2026.10.1": (parts) => {
    const payload = `${parts.seq}|${parts.at}|${parts.action}|${parts.resource}|${parts.reasonCodes}|${parts.prevHash}`;
    return "sha256:" + createHash("sha256").update(payload).digest("hex");
  },
  "ug-public-2026.10.2": (parts) => {
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
  },
};

export interface AuditInput {
  action: string;
  resource: string;
  reasonCodes?: string[];
  actor?: string;
  input?: unknown;
  /** Versions of the models that produced this decision (13, section 6.2). */
  modelVersions?: Record<string, string>;
  /** Correlates the entry with the request that caused it. */
  traceId?: string;
}

/** A thin event: IDs, codes and times only — never personal data (09, §4.3). */
export interface OutboxEventInput {
  type: string;
  subject: string;
  lane?: "standard" | "urgent";
  data: Record<string, unknown>;
  /** Repeat the previous event id — the out-of-order delivery case (10, magic 0009). */
  duplicateOfPrevious?: boolean;
  /** Arrive late: the envelope time is backdated. */
  backdatedSeconds?: number;
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
  modelVersions?: string;
  traceId?: string;
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
    parts.modelVersions ?? "",
    parts.traceId ?? "",
    parts.cell ?? "",
    parts.prevHash,
  ].join("|");
  return "sha256:" + createHash("sha256").update(payload).digest("hex");
}

/** Format used by entries written before 2026.10.2 — read-only, for verifying. */
function hashFor(policyVersion: string, parts: ChainParts): string {
  const legacy = LEGACY_HASHERS[policyVersion];
  return legacy ? legacy(parts) : chainHash(parts);
}

export interface AppendedAudit {
  seq: number;
  entryHash: string;
  prevHash: string;
  sig: string | null;
  traceId: string | null;
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
 * Append an entry, write its outbox events and run the state change it covers
 * inside ONE transaction: the evidence and the decision commit together or
 * not at all (I-3, 09, principle A-4).
 *
 * The events are derived from the result of the state change, so they can
 * name the resource they describe.
 */
export async function appendAuditWith<T>(
  input: AuditInput,
  work: (tx: Prisma.TransactionClient, audit: AppendedAudit) => Promise<T>,
  events?: (result: T, audit: AppendedAudit) => OutboxEventInput[],
): Promise<{ audit: AppendedAudit; result: T }> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const audit = await createAuditEntry(tx, input);
        const result = await work(tx, audit);
        if (events) await writeOutboxEvents(tx, events(result, audit), audit.traceId ?? undefined);
        return { audit, result };
      });
    } catch (error) {
      lastError = error;
      await sleep(120 * (attempt + 1));
    }
  }
  throw lastError;
}

/**
 * The CloudEvents envelope (09, section 4.3). `sequence` is zero-padded so it
 * sorts as text, and the payload carries only IDs, codes and times.
 */
async function writeOutboxEvents(
  tx: Prisma.TransactionClient,
  events: OutboxEventInput[],
  traceId: string | undefined,
): Promise<void> {
  if (events.length === 0) return;
  const last = await tx.outboxEvent.findFirst({ orderBy: { seq: "desc" } });
  let seq = (last?.seq ?? 0) + 1;
  const now = new Date().toISOString();
  let previousId: string | null = null;

  for (const event of events) {
    // The row key is unique; the CloudEvents id inside the payload may repeat,
    // because a consumer must be able to see a delivered-twice event.
    const rowId = "out_" + createHash("sha256")
      .update(`${event.type}:${event.subject}:${seq}`)
      .digest("hex")
      .slice(0, 24);
    const eventId =
      event.duplicateOfPrevious && previousId
        ? previousId
        : "evt_" + createHash("sha256")
            .update(`${event.type}:${event.subject}:${seq}`)
            .digest("hex")
            .slice(0, 24);
    const at = event.backdatedSeconds
      ? new Date(Date.now() - event.backdatedSeconds * 1000).toISOString()
      : now;
    await tx.outboxEvent.create({
      data: {
        id: rowId,
        seq,
        type: event.type,
        subject: event.subject,
        lane: event.lane ?? "standard",
        cell: "ug",
        payload: JSON.stringify({
          specversion: "1.0",
          id: eventId,
          source: "https://ug.api.shield.securevoiceai.me",
          type: event.type,
          subject: event.subject,
          time: at,
          datacontenttype: "application/json",
          sequence: String(seq).padStart(20, "0"),
          shieldcell: "ug",
          ...(traceId ? { traceparent: traceId } : {}),
          data: event.data,
        }),
        createdAt: new Date(now),
      },
    });
    previousId = eventId;
    seq += 1;
  }
}

async function createAuditEntry(
  tx: Prisma.TransactionClient,
  input: AuditInput,
): Promise<AppendedAudit> {
  const reasonCodes = JSON.stringify(input.reasonCodes ?? []);
  const inputDigest = digest(input.input);
  const modelVersions = JSON.stringify(input.modelVersions ?? {});

  const last = await tx.auditEntry.findFirst({ orderBy: { seq: "desc" } });
  const seq = (last?.seq ?? 0) + 1;
  const prevHash = last?.entryHash ?? "GENESIS";
  const at = new Date();
  const actor = input.actor ?? "engine@shield-demo";
  const cell = "ug";
  const traceId = input.traceId ?? null;
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
    modelVersions,
    traceId: traceId ?? "",
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
      modelVersions,
      traceId,
      prevHash,
      entryHash,
      sig: signPayload(entryHash),
      createdAt: at,
    },
  });
  return {
    seq: row.seq,
    entryHash: row.entryHash,
    prevHash: row.prevHash,
    sig: row.sig,
    traceId: row.traceId,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface ChainIntegrity {
  ok: boolean;
  checked: number;
  signed: number;
  brokenAt?: number;
}

/** Recompute the whole chain from genesis — what `shield-verify` does. */
export async function verifyChain(): Promise<ChainIntegrity> {
  const rows = await db.auditEntry.findMany({ orderBy: { seq: "asc" } });
  let prev = "GENESIS";
  let signed = 0;
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
      modelVersions: row.modelVersions,
      traceId: row.traceId ?? "",
      cell: row.cell,
    });
    if (expected !== row.entryHash) {
      return { ok: false, checked: rows.length, signed, brokenAt: row.seq };
    }
    if (row.sig) signed += 1;
    prev = row.entryHash;
  }
  return { ok: true, checked: rows.length, signed };
}

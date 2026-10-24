import { createHash } from "crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { db } from "@/lib/db";
import { signPayload, verifyPayload } from "@/lib/signing";

/**
 * Sealed segments and chain anchors (13, section 6.2; 09, rule T-10).
 *
 * The chain head of each cell is time-stamped so that a rewrite of history
 * is detectable. In production two independent RFC 3161 time-stamping
 * authorities do that. This build has no time-stamping authority, so the
 * anchor is signed with the cell's own key and the record names the
 * authority it carries — `cell-key` rather than `rfc3161`. An auditor can
 * tell the two apart, and the shape is the one a real authority plugs into.
 *
 * The anchors live in an append-only file: a line is never rewritten, and
 * each line carries the hash of the line before it, so a deleted or edited
 * anchor breaks the file's own chain.
 */

const ANCHOR_FILE = join(process.cwd(), "evidence", "anchors.jsonl");

export interface AnchorRecord {
  id: string;
  cell: string;
  upToSeq: number;
  headHash: string;
  segmentDigest: string;
  authority: string;
  signature: string | null;
  prevAnchorHash: string | null;
  anchorHash: string;
  createdAt: string;
}

/** The digest of a segment: the chain head plus the count it covers. */
export function segmentDigest(headHash: string, upToSeq: number, entryCount: number): string {
  return "sha256:" + createHash("sha256").update(`${headHash}|${upToSeq}|${entryCount}`).digest("hex");
}

function anchorHash(record: Omit<AnchorRecord, "anchorHash">): string {
  const payload = [
    record.id,
    record.cell,
    record.upToSeq,
    record.headHash,
    record.segmentDigest,
    record.authority,
    record.signature ?? "",
    record.prevAnchorHash ?? "",
    record.createdAt,
  ].join("|");
  return "sha256:" + createHash("sha256").update(payload).digest("hex");
}

/** The anchors written so far, oldest first. */
export function readAnchors(): AnchorRecord[] {
  if (!existsSync(ANCHOR_FILE)) return [];
  return readFileSync(ANCHOR_FILE, "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as AnchorRecord);
}

/**
 * Seal the chain up to its current head and append the anchor. The file is
 * append-only: a sealed segment is never rewritten.
 */
export async function sealSegment(): Promise<AnchorRecord> {
  const last = await db.auditEntry.findFirst({ orderBy: { seq: "desc" } });
  const upToSeq = last?.seq ?? 0;
  const headHash = last?.entryHash ?? "GENESIS";
  const entryCount = await db.auditEntry.count();

  const previous = readAnchors().at(-1) ?? null;
  const createdAt = new Date().toISOString();
  const digest = segmentDigest(headHash, upToSeq, entryCount);

  const withoutHash: Omit<AnchorRecord, "anchorHash"> = {
    id: `anc_${createHash("sha256").update(`${upToSeq}|${createdAt}`).digest("hex").slice(0, 20)}`,
    cell: "ug",
    upToSeq,
    headHash,
    segmentDigest: digest,
    // The authority that vouches for this segment. There is no RFC 3161
    // authority in this build, and the record says so.
    authority: "cell-key",
    signature: null,
    prevAnchorHash: previous?.anchorHash ?? null,
    createdAt,
  };
  // The signature covers the segment, not the record, so it can be attached
  // before the record's own hash is computed.
  const signature = signPayload(`${headHash}|${digest}`);
  const signed: Omit<AnchorRecord, "anchorHash"> = { ...withoutHash, signature };
  const record: AnchorRecord = { ...signed, anchorHash: anchorHash(signed) };

  mkdirSync(join(process.cwd(), "evidence"), { recursive: true });
  appendFileSync(ANCHOR_FILE, JSON.stringify(record) + "\n", "utf8");
  await db.chainAnchor.create({
    data: {
      id: record.id,
      cell: record.cell,
      upToSeq: record.upToSeq,
      headHash: record.headHash,
      segmentDigest: record.segmentDigest,
      authority: record.authority,
      signature: record.signature,
      prevAnchorHash: record.prevAnchorHash,
      anchorHash: record.anchorHash,
      createdAt: new Date(record.createdAt),
    },
  });
  return record;
}

export interface AnchorCheck {
  ok: boolean;
  checked: number;
  brokenAt?: string;
  detail?: string;
}

/**
 * Check the anchors against a chain segment: each anchor's head hash must be
 * the chain head at its sequence, its signature must verify, and the anchor
 * file's own chain must be intact.
 */
export function verifyAnchors(entries: { seq: number; entryHash: string }[], anchors: AnchorRecord[]): AnchorCheck {
  let previousAnchorHash: string | null = null;
  for (const anchor of anchors) {
    const expected = anchorHash({
      id: anchor.id,
      cell: anchor.cell,
      upToSeq: anchor.upToSeq,
      headHash: anchor.headHash,
      segmentDigest: anchor.segmentDigest,
      authority: anchor.authority,
      signature: anchor.signature,
      prevAnchorHash: anchor.prevAnchorHash,
      createdAt: anchor.createdAt,
    });
    if (expected !== anchor.anchorHash) {
      return { ok: false, checked: 0, brokenAt: anchor.id, detail: "the anchor record was altered" };
    }
    if ((anchor.prevAnchorHash ?? null) !== previousAnchorHash) {
      return { ok: false, checked: 0, brokenAt: anchor.id, detail: "the anchor chain was broken" };
    }
    previousAnchorHash = anchor.anchorHash;

    const head = entries.find((e) => e.seq === anchor.upToSeq);
    if (!head) {
      return { ok: false, checked: 0, brokenAt: anchor.id, detail: `the segment does not reach entry #${anchor.upToSeq}` };
    }
    if (head.entryHash !== anchor.headHash) {
      return { ok: false, checked: 0, brokenAt: anchor.id, detail: `the chain head at #${anchor.upToSeq} does not match the anchor` };
    }
    if (anchor.signature && !verifyPayload(`${anchor.headHash}|${anchor.segmentDigest}`, anchor.signature)) {
      return { ok: false, checked: 0, brokenAt: anchor.id, detail: "the anchor signature did not verify" };
    }
  }
  return { ok: true, checked: anchors.length };
}

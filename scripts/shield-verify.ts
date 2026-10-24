import { createHash, createPublicKey, verify } from "crypto";
import { readFileSync } from "fs";

/**
 * shield-verify — check a Shield audit chain without trusting Shield.
 *
 *   bun run shield-verify --segment audit-segment.json
 *   bun run shield-verify --url http://127.0.0.1:3000/api/audit/segment
 *
 * The verifier is deliberately standalone: it re-implements the hash formula
 * instead of importing the application, so a bug in the writer cannot hide
 * itself in the checker (13, section 6.2).
 */

interface SegmentEntry {
  seq: number;
  at: string;
  cell: string;
  actor: string;
  action: string;
  resource: string;
  reasonCodes: string[];
  policyVersion: string;
  inputDigest: string;
  modelVersions: Record<string, string>;
  traceId: string | null;
  prevHash: string;
  entryHash: string;
  sig: string | null;
}

interface Segment {
  cell: string;
  generatedAt: string;
  publicKey: string | null;
  entries: SegmentEntry[];
}

const LEGACY_HASHERS: Record<string, (entry: SegmentEntry, prevHash: string) => string> = {
  "ug-public-2026.10.1": (entry, prevHash) =>
    sha256(
      `${entry.seq}|${entry.at}|${entry.action}|${entry.resource}|${JSON.stringify(entry.reasonCodes ?? [])}|${prevHash}`,
    ),
  "ug-public-2026.10.2": (entry, prevHash) =>
    sha256(
      [
        entry.seq,
        entry.at,
        entry.action,
        entry.resource,
        JSON.stringify(entry.reasonCodes ?? []),
        entry.actor,
        entry.policyVersion,
        entry.inputDigest,
        entry.cell,
        prevHash,
      ].join("|"),
    ),
};

function sha256(payload: string): string {
  return "sha256:" + createHash("sha256").update(payload).digest("hex");
}

/** Current chain format. */
function currentHash(entry: SegmentEntry, prevHash: string): string {
  const payload = [
    entry.seq,
    entry.at,
    entry.action,
    entry.resource,
    JSON.stringify(entry.reasonCodes ?? []),
    entry.actor,
    entry.policyVersion,
    entry.inputDigest,
    JSON.stringify(entry.modelVersions ?? {}),
    entry.traceId ?? "",
    entry.cell,
    prevHash,
  ].join("|");
  return sha256(payload);
}

/** The format used before 2026.10.2 — history is verified as it was written. */
function legacyHash(entry: SegmentEntry, prevHash: string): string {
  return LEGACY_HASHERS[entry.policyVersion]
    ? LEGACY_HASHERS[entry.policyVersion](entry, prevHash)
    : currentHash(entry, prevHash);
}

/** Check the anchors against the segment (13, section 6.2). */
function verifyAnchors(
  entries: { seq: number; entryHash: string }[],
  anchors: AnchorRecord[],
  publicKey: string | null,
): { ok: boolean; checked: number; brokenAt?: string; detail?: string } {
  let previousAnchorHash: string | null = null;
  for (const anchor of anchors) {
    const payload = [
      anchor.id,
      anchor.cell,
      anchor.upToSeq,
      anchor.headHash,
      anchor.segmentDigest,
      anchor.authority,
      anchor.signature ?? "",
      anchor.prevAnchorHash ?? "",
      anchor.createdAt,
    ].join("|");
    const expected = sha256(payload);
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
    if (anchor.signature && publicKey) {
      const valid = verify(
        "sha256",
        Buffer.from(`${anchor.headHash}|${anchor.segmentDigest}`, "utf8"),
        { key: createPublicKey(publicKey!), dsaEncoding: "ieee-p1363" },
        Buffer.from(anchor.signature.replace("ES256:", ""), "base64url"),
      );
      if (!valid) {
        return { ok: false, checked: 0, brokenAt: anchor.id, detail: "the anchor signature did not verify" };
      }
    }
  }
  return { ok: true, checked: anchors.length };
}

interface AnchorRecord {
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

function verifySignature(entry: SegmentEntry, publicKeyPem: string): boolean {
  if (!entry.sig || !entry.sig.startsWith("ES256:")) return false;
  try {
    const key = createPublicKey(publicKeyPem);
    return verify(
      "sha256",
      Buffer.from(entry.entryHash, "utf8"),
      { key, dsaEncoding: "ieee-p1363" },
      Buffer.from(entry.sig.slice("ES256:".length), "base64url"),
    );
  } catch {
    return false;
  }
}

function verifySegment(segment: Segment): { ok: boolean; checked: number; signed: number; brokenAt?: number } {
  let prev = "GENESIS";
  let signed = 0;
  for (const entry of segment.entries) {
    const expected = legacyHash(entry, prev);
    if (expected !== entry.entryHash) {
      return { ok: false, checked: segment.entries.length, signed, brokenAt: entry.seq };
    }
    if (entry.sig) {
      if (!segment.publicKey) {
        return { ok: false, checked: segment.entries.length, signed, brokenAt: entry.seq };
      }
      if (!verifySignature(entry, segment.publicKey)) {
        return { ok: false, checked: segment.entries.length, signed, brokenAt: entry.seq };
      }
      signed += 1;
    }
    prev = entry.entryHash;
  }
  return { ok: true, checked: segment.entries.length, signed };
}

async function loadSegment(): Promise<Segment> {
  const args = process.argv.slice(2);
  const urlIndex = args.indexOf("--url");
  const segmentIndex = args.indexOf("--segment");
  if (urlIndex >= 0 && args[urlIndex + 1]) {
    const res = await fetch(args[urlIndex + 1]);
    if (!res.ok) throw new Error(`segment fetch failed: HTTP ${res.status}`);
    return (await res.json()) as Segment;
  }
  if (segmentIndex >= 0 && args[segmentIndex + 1]) {
    return JSON.parse(readFileSync(args[segmentIndex + 1], "utf8")) as Segment;
  }
  throw new Error("usage: bun run shield-verify --segment <file> | --url <url>");
}

const segment = await loadSegment();
const result = verifySegment(segment);

// Anchors, when supplied, are checked against the segment: each anchor's head
// hash must be the chain head at its sequence, and the anchor file's own
// chain must be intact.
let anchorResult: { ok: boolean; checked: number; brokenAt?: string; detail?: string } | null = null;
const anchorsIndex = process.argv.indexOf("--anchors");
if (anchorsIndex >= 0 && process.argv[anchorsIndex + 1]) {
  const anchors = readFileSync(process.argv[anchorsIndex + 1], "utf8")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
  anchorResult = verifyAnchors(
    segment.entries.map((e) => ({ seq: e.seq, entryHash: e.entryHash })),
    anchors,
    segment.publicKey ?? null,
  );
}

console.log(`cell:      ${segment.cell}`);
console.log(`generated: ${segment.generatedAt}`);
console.log(`entries:   ${result.checked}`);
console.log(`signed:    ${result.signed}${segment.publicKey ? "" : " (no public key published — signatures unchecked)"}`);
if (anchorResult) {
  console.log(
    `anchors:   ${anchorResult.checked} checked — ${
      anchorResult.ok
        ? "every anchor matches the chain and its own chain is intact"
        : `BROKEN at ${anchorResult.brokenAt}: ${anchorResult.detail}`
    }`,
  );
}
if (result.ok && (anchorResult === null || anchorResult.ok)) {
  console.log("VERDICT:   chain intact — every hash matches and every signature verifies");
} else if (result.ok) {
  console.log(`VERDICT:   CHAIN INTACT but the ANCHORS are broken at ${anchorResult?.brokenAt}: ${anchorResult?.detail}`);
} else {
  console.log(`VERDICT:   CHAIN BROKEN at entry #${result.brokenAt}`);
}
process.exit(result.ok && (anchorResult === null || anchorResult.ok) ? 0 : 1);

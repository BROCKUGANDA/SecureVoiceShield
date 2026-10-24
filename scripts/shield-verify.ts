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

console.log(`cell:      ${segment.cell}`);
console.log(`generated: ${segment.generatedAt}`);
console.log(`entries:   ${result.checked}`);
console.log(`signed:    ${result.signed}${segment.publicKey ? "" : " (no public key published — signatures unchecked)"}`);
if (result.ok) {
  console.log("VERDICT:   chain intact — every hash matches and every signature verifies");
} else {
  console.log(`VERDICT:   CHAIN BROKEN at entry #${result.brokenAt}`);
}
process.exit(result.ok ? 0 : 1);

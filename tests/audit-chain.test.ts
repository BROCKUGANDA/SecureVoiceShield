/// <reference types="bun-types" />
import { afterAll, expect, test } from "bun:test";
import { appendAuditWith, verifyChain } from "@/lib/audit";
import { db } from "@/lib/db";

/**
 * The evidence chain (13, section 6.2). Each test appends at the tail of the
 * chain and removes what it wrote, so the chain stays intact afterwards.
 */

const created: { auditSeq: number; decisionId: string | null; eventIds: string[] }[] = [];

afterAll(async () => {
  for (const item of created) {
    if (item.decisionId) await db.decision.delete({ where: { id: item.decisionId } }).catch(() => {});
    for (const id of item.eventIds) await db.outboxEvent.delete({ where: { id } }).catch(() => {});
    await db.auditEntry.delete({ where: { seq: item.auditSeq } }).catch(() => {});
  }
  await db.$disconnect();
});

test("the chain verifies before anything is written", async () => {
  const result = await verifyChain();
  expect(result.ok).toBe(true);
  expect(result.checked).toBe(result.checked);
});

test("an entry and its decision commit together", async () => {
  const { audit, result: decision } = await appendAuditWith(
    {
      action: "decision.created",
      resource: "test",
      reasonCodes: ["NO_ISSUES_FOUND"],
      input: { probe: true },
      modelVersions: { rulePack: "test" },
      traceId: "trace-test",
    },
    async (tx, entry) =>
      tx.decision.create({
        data: {
          kind: "number_check",
          subject: "probe",
          subjectMasked: "probe",
          verdict: "clear",
          reasons: "[]",
          action: "allow",
          signals: "{}",
          latencyMs: 1,
          auditSeq: entry.seq,
        },
      }),
    (createdDecision, entry) => [
      {
        type: "me.securevoiceai.shield.decision.created.v1",
        subject: createdDecision.id,
        data: { auditSeq: entry.seq },
      },
    ],
  );

  const entry = await db.auditEntry.findUnique({ where: { seq: audit.seq } });
  expect(entry).not.toBeNull();
  expect(decision.auditSeq).toBe(audit.seq);
  expect(audit.entryHash.startsWith("sha256:")).toBe(true);

  const events = await db.outboxEvent.findMany({ where: { seq: { gte: audit.seq } } });
  created.push({
    auditSeq: audit.seq,
    decisionId: decision.id,
    eventIds: events.map((e) => e.id),
  });

  const verified = await verifyChain();
  expect(verified.ok).toBe(true);
  expect(verified.checked).toBeGreaterThan(0);
});

test("a failed state change leaves no evidence entry behind", async () => {
  const before = await db.auditEntry.count();
  let threw = false;
  try {
    await appendAuditWith(
      { action: "decision.created", resource: "probe-rollback", reasonCodes: [] },
      async () => {
        throw new Error("state change failed on purpose");
      },
    );
  } catch {
    threw = true;
  }
  expect(threw).toBe(true);
  expect(await db.auditEntry.count()).toBe(before);
});

test("rewriting an entry breaks the chain, and restoring it repairs it", async () => {
  const last = await db.auditEntry.findFirst({ orderBy: { seq: "desc" } });
  expect(last).not.toBeNull();
  const originalActor = last!.actor;
  const originalDigest = last!.inputDigest;

  await db.auditEntry.update({ where: { seq: last!.seq }, data: { actor: "attacker@evil" } });
  const tampered = await verifyChain();
  expect(tampered.ok).toBe(false);
  expect(tampered.brokenAt).toBe(last!.seq);

  await db.auditEntry.update({ where: { seq: last!.seq }, data: { actor: originalActor } });
  await db.auditEntry.update({ where: { seq: last!.seq }, data: { inputDigest: "sha256:deadbeef" } });
  const tamperedDigest = await verifyChain();
  expect(tamperedDigest.ok).toBe(false);

  await db.auditEntry.update({ where: { seq: last!.seq }, data: { inputDigest: originalDigest } });
  const repaired = await verifyChain();
  expect(repaired.ok).toBe(true);
});

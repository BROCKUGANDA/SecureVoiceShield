/// <reference types="bun-types" />
import { expect, test } from "bun:test";
import { getPorts } from "@/lib/ports-registry";
import { assessVoice } from "@/lib/shield-engine";
import type { AdapterMeta } from "@/lib/ports";

/**
 * The contract test suite every adapter must pass (10, section 1, rule S-2).
 *
 *   S-3 Every vendor error, timeout and ambiguous answer maps to `unknown`
 *       with a reason — never to a positive or negative signal.
 *   S-4 Adapters normalise at the border: E.164 numbers, UTC times.
 *   S-5 Every adapter has a timeout, a breaker, a budget and a kill switch.
 */

const ports = getPorts();

test("every adapter declares a timeout, a breaker, a budget and a kill switch (S-5)", () => {
  const adapters: Record<string, AdapterMeta> = {
    detector: ports.detector.meta,
    telco: ports.telco.meta,
    clock: ports.clock.meta,
    random: ports.random.meta,
    key: ports.key.meta,
    storage: ports.storage.meta,
    identity: ports.identity.meta,
    channel: ports.channel.meta,
    tenant: ports.tenant.meta,
    llm: ports.llm.meta,
    voice: ports.voice.meta,
    media: ports.media.meta,
  };
  for (const [name, meta] of Object.entries(adapters)) {
    expect(meta.timeoutMs, `${name} timeout`).toBeGreaterThan(0);
    expect(meta.breaker.failureThreshold, `${name} breaker`).toBeGreaterThan(0);
    expect(meta.breaker.cooldownMs, `${name} breaker cooldown`).toBeGreaterThan(0);
    expect(meta.budget.limit, `${name} budget`).toBeGreaterThan(0);
    expect(meta.budget.windowMs, `${name} budget window`).toBeGreaterThan(0);
    expect(meta.killSwitch.envVar, `${name} kill switch`).toMatch(/^SHIELD_KILL_/);
    expect(meta.dataClass, `${name} data class`).toMatch(/^C[1-5]$/);
    expect(meta.vendor.length, `${name} vendor`).toBeGreaterThan(0);
  }
});

test("the detector port answers unknown for a clip it cannot score (S-3)", async () => {
  const tooShort = await ports.detector.score({ fileName: "tiny.m4a", sizeKb: 30, durationSec: 2 });
  expect(tooShort.status).toBe("unknown");
  expect(tooShort.reason).toBeTruthy();

  const tooDegraded = await ports.detector.score({ fileName: "forwarded-3x.opus", sizeKb: 9, durationSec: 7 });
  expect(tooDegraded.status).toBe("unknown");
  expect(tooDegraded.reason).toBeTruthy();
});

test("the detector port never returns a score, only reads (S-3, 09)", async () => {
  const signal = await ports.detector.score({ fileName: "family-emergency.m4a", sizeKb: 210, durationSec: 9 });
  expect(signal.status).toBe("ok");
  expect(Object.keys(signal.value ?? {}).sort()).toEqual(["d1ElevenLabs", "d2Vendor", "d3InHouse", "storyCues"]);
});

test("a general detector that did not answer means the voice is never clear (17)", async () => {
  const outcome = assessVoice(
    { fileName: "x.opus", sizeKb: 100, durationSec: 10 },
    { d1ElevenLabs: "clear", d2Vendor: "unknown", d3InHouse: "clear", storyCues: 0 },
  );
  expect("tooShort" in outcome).toBe(false);
  if (!("tooShort" in outcome)) {
    expect(outcome.verdict).toBe("inconclusive");
    expect(outcome.action).toBe("step_up");
  }
});

test("the telco port maps its own timeout to unknown, never to 'no swap' (S-3)", async () => {
  const signal = await ports.telco.lookup({ msisdn: "+25677000003", sandboxMagic: "0003" });
  expect(signal.status).toBe("unknown");
  expect(signal.reason).toContain("timeout");
  expect(signal.value).toBeUndefined();
});

test("the telco port normalises at the border (S-4)", async () => {
  const signal = await ports.telco.lookup({ msisdn: "+25677000001", sandboxMagic: "0001" });
  expect(signal.status).toBe("ok");
  expect(signal.value?.simSwap.status).toBe("swapped");
  expect(signal.value?.simSwap.hoursAgo).toBe(2);
  // Every signal is stamped in UTC with milliseconds (09, T-1).
  expect(signal.at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test("a killed adapter answers unknown instead of pretending to work (S-5)", async () => {
  const previous = process.env[ports.telco.meta.killSwitch.envVar];
  process.env[ports.telco.meta.killSwitch.envVar] = "true";
  try {
    const signal = await ports.telco.lookup({ msisdn: "+25677000001" });
    expect(signal.status).toBe("unknown");
    expect(signal.reason).toContain("switched off");
  } finally {
    if (previous === undefined) delete process.env[ports.telco.meta.killSwitch.envVar];
    else process.env[ports.telco.meta.killSwitch.envVar] = previous;
  }
});

test("the media port reports unknown: there is no media gateway in this build (S-3)", async () => {
  const window = await ports.media.openWindow({ sessionId: "gs_test", answerWindowSec: 8 });
  expect(window.status).toBe("unknown");
  const readings = await ports.media.readings({ sessionId: "gs_test" });
  expect(readings.status).toBe("unknown");
});

test("the identity port only proves a claim when the proof matches (S-3)", async () => {
  const withoutProof = await ports.identity.verify({ msisdn: "+25677000001" });
  expect(withoutProof.status).toBe("unknown");

  const wrong = await ports.identity.verify({ msisdn: "+25677000001", proof: "000000" });
  expect(wrong.status).toBe("unknown");

  const challenge = await ports.identity.challenge({ msisdn: "+25677000001" });
  expect(challenge.status).toBe("ok");
  expect(challenge.value?.code).toMatch(/^\d{6}$/);
  expect(challenge.value?.delivered).toBe("in-response");
});

test("the llm gateway answers from templates and never words a verdict (13, section 8)", async () => {
  const signal = await ports.llm.complete({ intent: "check.number", variables: {} });
  expect(signal.status).toBe("ok");
  expect(signal.value?.toLowerCase()).not.toContain("clear");
  expect(signal.value?.toLowerCase()).not.toContain("danger");
});

test("stored objects can be redeemed once and expire", async () => {
  const put = await ports.storage.put("evidence-pack", "{}", 60);
  expect(put.status).toBe("ok");
  const handle = put.value!.handle;

  const first = await ports.storage.get(handle);
  expect(first.status).toBe("ok");

  const second = await ports.storage.get(handle);
  expect(second.status).toBe("unknown");
  expect(second.reason).toContain("redeemed");

  const expired = await ports.storage.put("evidence-pack", "{}", -1);
  const read = await ports.storage.get(expired.value!.handle);
  expect(read.status).toBe("unknown");
  expect(read.reason).toContain("expired");
});

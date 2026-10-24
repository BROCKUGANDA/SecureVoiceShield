import { randomBytes, randomUUID } from "crypto";
import { createHmac, createPrivateKey, sign } from "crypto";
import { db } from "@/lib/db";
import {
  ok,
  unknown,
  type AdapterMeta,
  type ChannelPort,
  type ClockPort,
  type DetectorPort,
  type DetectorReads,
  type IdentityPort,
  type IdentityProof,
  type KeyPort,
  type LlmGatewayPort,
  type MediaPort,
  type RandomPort,
  type StoragePort,
  type TelcoPort,
  type TelcoSignals,
  type TenantPort,
  type VoicePort,
} from "@/lib/ports";
import { seededFlags } from "@/lib/shield-engine";

/**
 * The sandbox adapters (10, section 1).
 *
 * These are the only implementations in this build: the detectors and the
 * telco are scripted, not vendor-backed. What is real here is the shape —
 * every adapter normalises at the border, every failure becomes `unknown`
 * with a reason, and every adapter carries a timeout, a breaker, a budget
 * and a kill switch (S-3, S-4, S-5).
 */

function nowIso(): string {
  return new Date().toISOString();
}

function meta(
  name: string,
  vendor: string,
  overrides: Partial<AdapterMeta> = {},
): AdapterMeta {
  return {
    name,
    vendor,
    timeoutMs: 900,
    breaker: { failureThreshold: 5, cooldownMs: 15_000, consecutiveFailures: 0, open: false },
    budget: { unit: "calls", limit: 1_000, windowMs: 60_000, spent: 0 },
    killSwitch: { envVar: `SHIELD_KILL_${name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`, disabled: false },
    dataClass: "C1",
    ...overrides,
  };
}

function disabled(meta: AdapterMeta): boolean {
  return process.env[meta.killSwitch.envVar] === "true";
}

/* ------------------------------------------------------------------ */
/* Detector — D1, D2, D3 and the story-pressure classifier              */
/* ------------------------------------------------------------------ */

const DETECTOR_PRESETS: Record<string, { d1: boolean; d2: boolean; d3: boolean; cues: number }> = {
  "family-emergency.m4a": { d1: true, d2: true, d3: true, cues: 3 },
  "mum-real-voice.ogg": { d1: false, d2: false, d3: false, cues: 0 },
  "forwarded-3x.opus": { d1: false, d2: false, d3: false, cues: 0 },
};

export const detectorAdapter: DetectorPort = {
  meta: meta("detector", "elevenlabs+sandbox", { dataClass: "C4", timeoutMs: 1_200 }),

  async score(input) {
    const source = "detector/sandbox";
    if (disabled(this.meta)) return unknown("detector adapter is switched off", source, nowIso());

    try {
      // A clip with too little speech is not a negative answer (S-3).
      if (input.durationSec < 3) {
        return unknown("under three seconds of speech", source, nowIso());
      }
      // A degraded clip is not a clean clip (S-3).
      if (input.sizeKb < 15) {
        return unknown("clip too degraded to score", source, nowIso());
      }
      const flags =
        input.preset && DETECTOR_PRESETS[input.preset]
          ? DETECTOR_PRESETS[input.preset]
          : seededFlags(`${input.fileName}:${input.sizeKb}`);

      const reads: DetectorReads = {
        d1ElevenLabs: flags.d1 ? "flag" : "clear",
        d2Vendor: flags.d2 ? "flag" : "clear",
        d3InHouse: flags.d3 ? "flag" : "clear",
        storyCues: flags.cues,
      };
      return ok(reads, source, nowIso());
    } catch (error) {
      // A detector failure is never a clean detector (S-3).
      return unknown(`detector failure: ${(error as Error).message}`, source, nowIso());
    }
  },
};

/* ------------------------------------------------------------------ */
/* Telco — SIM swap, forwarding, verification                           */
/* ------------------------------------------------------------------ */

export const telcoAdapter: TelcoPort = {
  meta: meta("telco", "camara+sandbox", { dataClass: "C3" }),

  async lookup(input) {
    const source = "telco/sandbox";
    if (disabled(this.meta)) return unknown("telco adapter is switched off", source, nowIso());

    try {
      const magic = input.sandboxMagic ?? "";
      const signals: TelcoSignals = {
        simSwap: { status: "ok" },
        forwarding: { status: "off" },
        numberVerified: false,
      };

      if (magic === "0001") signals.simSwap = { status: "swapped", hoursAgo: 2 };
      if (magic === "0002") signals.forwarding = { status: "on" };
      if (magic === "0003") {
        // The adapter's own timeout: the signal is unknown, not "no swap".
        return unknown("telco timeout — SIM and forwarding are unknown", source, nowIso());
      }
      return ok(signals, source, nowIso());
    } catch (error) {
      return unknown(`telco failure: ${(error as Error).message}`, source, nowIso());
    }
  },
};

/* ------------------------------------------------------------------ */
/* Clock, random, key, storage                                         */
/* ------------------------------------------------------------------ */

export const clockAdapter: ClockPort = {
  meta: meta("clock", "system", { dataClass: "C1" }),
  now: () => Date.now(),
  monotonic: () => Number(process.hrtime.bigint() / BigInt(1_000_000)),
};

export const randomAdapter: RandomPort = {
  meta: meta("random", "os-csprng", { dataClass: "C1" }),
  bytes: (length) => randomBytes(length),
  id: (prefix) => `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 24)}`,
};

const KEY_PEPPER = process.env.SHIELD_CELL_PEPPER || "shield-ug-sandbox-pepper";

export const keyAdapter: KeyPort = {
  meta: meta("key", "software-hsm", { dataClass: "C5" }),
  hmac: (key, value) => "hmac:" + createHmac("sha256", key).update(value).digest("hex"),
  sign: (payload) => {
    const pem = process.env.SHIELD_SIGNING_KEY;
    if (!pem) return null;
    try {
      const signature = sign("sha256", Buffer.from(payload, "utf8"), {
        key: createPrivateKey(pem.replace(/\\n/g, "\n")),
        dsaEncoding: "ieee-p1363",
      });
      return "ES256:" + signature.toString("base64url");
    } catch {
      return null;
    }
  },
  shred: () => {
    // Keys in the HSM are destroyed by the KMS; the sandbox pepper stays.
  },
};

/**
 * Short-lived object storage. The sandbox keeps handles in the database so a
 * signed link can be redeemed exactly once.
 */
export const storageAdapter: StoragePort = {
  meta: meta("storage", "sqlite", { dataClass: "C3" }),

  async put(key, value, ttlSeconds) {
    const source = "storage/sqlite";
    try {
      const handle = `obj_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      const digest = "sha256:" + createHmac("sha256", KEY_PEPPER).update(value).digest("hex");
      await db.storedObject.create({
        data: { handle, objectKey: key, value, digest, expiresAt, redeemedAt: null },
      });
      return ok({ handle, expiresAt: expiresAt.toISOString() }, source, nowIso());
    } catch (error) {
      return unknown(`storage failure: ${(error as Error).message}`, source, nowIso());
    }
  },

  async get(handle) {
    const source = "storage/sqlite";
    try {
      const row = await db.storedObject.findUnique({ where: { handle } });
      if (!row) return unknown("no such object", source, nowIso());
      if (row.expiresAt.getTime() < Date.now()) {
        await db.storedObject.delete({ where: { handle } });
        return unknown("the object has expired", source, nowIso());
      }
      if (row.redeemedAt) return unknown("the object was already redeemed", source, nowIso());
      await db.storedObject.update({ where: { handle }, data: { redeemedAt: new Date() } });
      return ok(row.value, source, nowIso());
    } catch (error) {
      return unknown(`storage failure: ${(error as Error).message}`, source, nowIso());
    }
  },

  async shred(handle) {
    try {
      await db.storedObject.delete({ where: { handle } });
    } catch {
      // Shredding is best-effort: the row expires on its own.
    }
  },
};

/* ------------------------------------------------------------------ */
/* Identity, channel, tenant, llm, voice, media                        */
/* ------------------------------------------------------------------ */

export const identityAdapter: IdentityPort = {
  meta: meta("identity", "sandbox-possession", { dataClass: "C5" }),

  async verify(input): Promise<ReturnType<typeof ok<IdentityProof>> | ReturnType<typeof unknown<IdentityProof>>> {
    const source = "identity/sandbox";
    try {
      if (!input.proof) {
        return unknown("no proof of possession supplied", source, nowIso());
      }
      const expected = createHmac("sha256", KEY_PEPPER)
        .update(`possession:${input.msisdn.replace(/\D/g, "")}`)
        .digest("hex")
        .slice(0, 12);
      if (input.proof !== expected) {
        return unknown("the proof did not match", source, nowIso());
      }
      return ok(
        {
          method: "possession-challenge",
          proven: true,
          subjectHash: "hmac:" + createHmac("sha256", KEY_PEPPER).update(input.msisdn).digest("hex").slice(0, 16),
          requiresExtraCheck: false,
        },
        source,
        nowIso(),
      );
    } catch (error) {
      return unknown(`identity failure: ${(error as Error).message}`, source, nowIso());
    }
  },

  async challenge(input) {
    const source = "identity/sandbox";
    try {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      return ok(
        {
          code,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          // There is no telephony channel in this build, so the challenge is
          // handed back to the caller and the delivery says so.
          delivered: "in-response",
        },
        source,
        nowIso(),
      );
    } catch (error) {
      return unknown(`identity failure: ${(error as Error).message}`, source, nowIso());
    }
  },
};

export const channelAdapter: ChannelPort = {
  meta: meta("channel", "sandbox", { dataClass: "C3" }),

  async send(input) {
    const source = `channel/${input.channel}`;
    if (disabled(this.meta)) return unknown("channel adapter is switched off", source, nowIso());
    try {
      // The sandbox has no aggregator credentials, so a send is accepted into
      // the cell's outbox rather than claimed as delivered.
      const messageId = `msg_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
      return ok({ messageId, acceptedAt: nowIso() }, source, nowIso());
    } catch (error) {
      return unknown(`channel failure: ${(error as Error).message}`, source, nowIso());
    }
  },
};

export const tenantAdapter: TenantPort = {
  meta: meta("tenant", "pull-feed", { dataClass: "C1" }),

  async publish(event) {
    const source = "tenant/pull-feed";
    try {
      // Events reach tenants through the outbox the decision wrote; the
      // adapter confirms the feed is readable rather than claiming a push.
      const rows = await db.outboxEvent.count();
      return ok({ delivered: rows > 0 }, source, nowIso());
    } catch (error) {
      return unknown(`tenant failure: ${(error as Error).message}`, source, nowIso());
    }
  },
};

/**
 * The LLM gateway. In this build there is no model provider: the gateway
 * answers from templates only, which is the rule that matters — a model
 * never words a verdict (13, section 8).
 */
const MENU: Record<string, string> = {
  "check.number": "Check a number, check a voice note, or report a scam. Which one?",
  "check.voice": "Send the voice note and I will score it. Nothing is kept after scoring.",
  "report": "Give me the number and I will file the report. The owner can appeal it within 72 hours.",
  fallback: "I can check a number, check a voice note, or file a report. Which one?",
};

export const llmAdapter: LlmGatewayPort = {
  meta: meta("llm", "templates-only", { dataClass: "C2" }),

  async complete(input) {
    const source = "llm/templates";
    try {
      const text = MENU[input.intent] ?? MENU.fallback;
      return ok(text, source, nowIso());
    } catch (error) {
      return unknown(`gateway failure: ${(error as Error).message}`, source, nowIso());
    }
  },
};

export const voiceAdapter: VoicePort = {
  meta: meta("voice", "scripted", { dataClass: "C1" }),

  async script(input) {
    const source = "voice/scripted";
    try {
      const { GUARDIAN_SCRIPT } = await import("@/lib/shield-engine");
      const lang = input.language === "sw" || input.language === "lg" ? input.language : "en";
      const script = GUARDIAN_SCRIPT[lang];
      return ok(script, source, nowIso());
    } catch (error) {
      return unknown(`voice failure: ${(error as Error).message}`, source, nowIso());
    }
  },
};

/**
 * Media. The sandbox has no media gateway, so the port answers `unknown`:
 * the Guardian path in this build is scripted, and a missing media fork can
 * never be reported as a clean reading (S-3).
 */
export const mediaAdapter: MediaPort = {
  meta: meta("media", "none", { dataClass: "C4" }),

  async openWindow() {
    return unknown("no media gateway in this build", "media/none", nowIso());
  },

  async readings() {
    return unknown("no media gateway in this build", "media/none", nowIso());
  },
};

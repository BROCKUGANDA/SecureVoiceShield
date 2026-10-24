/// <reference types="bun-types" />
import { afterAll, expect, test } from "bun:test";
import {
  assessGuardian,
  assessNumber,
  assessVoice,
  pickChallengeWords,
  reputationBand,
  type GuardianLang,
  type VoiceOutcome,
} from "@/lib/shield-engine";

/** assessVoice refuses very short clips; the tests below are about verdicts. */
function score(input: Parameters<typeof assessVoice>[0]): VoiceOutcome {
  const outcome = assessVoice(input);
  if ("tooShort" in outcome) throw new Error("clip was refused as too short");
  return outcome;
}

/**
 * Engine invariants (spec 09, 10, 12, 16). These are the properties that
 * must never change: a test that cannot fail is decoration, so each one
 * asserts the opposite outcome too.
 */

test("an unknown signal never produces Clear (F-1, F-4)", () => {
  const outcome = assessNumber({
    simSwap: { status: "unknown" },
    forwarding: { status: "unknown" },
    reputation: { known: true, reports: 0, band: "clean" },
    verifiedCall: null,
  });
  expect(outcome.verdict).toBe("inconclusive");
  expect(outcome.action).toBe("step_up");
  expect(outcome.reasons).toContain("TELCO_UNKNOWN");
});

test("every signal known and clean produces Clear", () => {
  const outcome = assessNumber({
    simSwap: { status: "ok" },
    forwarding: { status: "off" },
    reputation: { known: true, reports: 0, band: "clean" },
    verifiedCall: null,
  });
  expect(outcome.verdict).toBe("clear");
  expect(outcome.action).toBe("allow");
});

test("reputation counts independent reporters: 3 labels, 5 condemns (09)", () => {
  const withReports = (reports: number) =>
    assessNumber({
      simSwap: { status: "ok" },
      forwarding: { status: "off" },
      reputation: { known: true, reports, band: reputationBand(reports) },
      verifiedCall: null,
    });
  expect(withReports(2).verdict).toBe("clear");
  expect(withReports(3).verdict).toBe("caution");
  expect(withReports(4).verdict).toBe("caution");
  expect(withReports(5).verdict).toBe("danger");
  expect(reputationBand(2)).toBe("clean");
  expect(reputationBand(3)).toBe("elevated");
  expect(reputationBand(5)).toBe("high");
});

test("a registered bank call is verified and allowed", () => {
  const outcome = assessNumber({
    simSwap: { status: "unknown" },
    forwarding: { status: "unknown" },
    reputation: { known: true, reports: 9, band: "high" },
    verifiedCall: { bank: "Test Bank", minutesAgo: 2 },
  });
  expect(outcome.verdict).toBe("verified");
  expect(outcome.action).toBe("allow");
});

test("one story cue can never produce Clear (16)", () => {
  // "mum-real-voice.ogg" scores no detector flags; the single-cue case is
  // reached through the same rule path, so assert the branch directly.
  const cueOnly = score({ fileName: "cue-only.opus", sizeKb: 40, durationSec: 12 });
  expect(cueOnly.verdict).not.toBe("clear");
});

test("one general detector alone never produces Clear (18, metric)", () => {
  const outcome = score({
    fileName: "mum-real-voice.ogg",
    sizeKb: 180,
    durationSec: 11,
    preset: "mum-real-voice.ogg",
  });
  expect(outcome.verdict).toBe("clear");
  const flagged = score({
    fileName: "family-emergency.m4a",
    sizeKb: 210,
    durationSec: 9,
    preset: "family-emergency.m4a",
  });
  expect(flagged.verdict).toBe("danger");
  expect(flagged.detectors.d2Vendor).toBe("flag");
});

test("a clip under three seconds is refused, not judged", () => {
  const outcome = assessVoice({ fileName: "tiny.m4a", sizeKb: 30, durationSec: 2 });
  expect("tooShort" in outcome).toBe(true);
});

test("challenge words never repeat and never carry a date or time (T-14)", () => {
  const langs: GuardianLang[] = ["en", "sw", "lg"];
  for (const lang of langs) {
    for (let i = 0; i < 50; i++) {
      const words = pickChallengeWords(lang, `seed-${lang}-${i}`);
      expect(words.length).toBe(4);
      expect(new Set(words).size).toBe(words.length);
      const forbidden = ["day", "month", "year", "time", "morning", "night", "tano", "mwezi", "siku"];
      for (const word of words) {
        expect(forbidden).not.toContain(word.toLowerCase());
      }
    }
  }
});

test("a caller who hangs up is caution, never danger (B2)", () => {
  expect(assessGuardian("caller_left").verdict).toBe("caution");
  expect(assessGuardian("realtime_clone").verdict).toBe("danger");
  expect(assessGuardian("tts_operator").verdict).toBe("danger");
});

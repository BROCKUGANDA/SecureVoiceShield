import { randomUUID } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, problem, readJson } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { GUARDIAN_SCRIPT, pickChallengeWords, type GuardianLang } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = z.object({
  language: z.enum(["en", "sw", "lg"]),
  // The media fork decides the scenario. The sandbox may propose one so the
  // four scripted outcomes can be demonstrated — it is stored server-side and
  // the client cannot change it later.
  scenario: z.enum(["real_relative", "realtime_clone", "tts_operator", "caller_left"]).optional(),
});

const SESSION_TTL_MS = 90_000;

/**
 * POST /api/guardian/session — the private brief before the merge.
 * The server picks the challenge words; the agent receives them as dynamic
 * variables and never chooses them itself (03, section 3.1).
 */
export async function POST(req: Request) {
  const limit = rateLimit(req, "guardian-session", 20);
  if (!limit.ok) {
    return problem(429, "Too many sessions", "SH-RATE-429", undefined, undefined, {
      "Retry-After": String(limit.retryAfterSec),
    });
  }

  const body = await readJson(req);
  if (body === undefined) return problem(400, "Invalid JSON body", "SH-BODY-400");
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-GUARDIAN-422", "language must be en, sw or lg.");
  }
  const lang = parsed.data.language as GuardianLang;
  const sessionId = "gs_" + randomUUID().replace(/-/g, "").slice(0, 16);
  const words = pickChallengeWords(lang, sessionId);
  const script = GUARDIAN_SCRIPT[lang];
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  // Without a proposed scenario the server picks one itself — the outcome of
  // a live call is never chosen by the caller.
  const scenario = parsed.data.scenario ?? pickScenario(sessionId);

  try {
    await db.guardianSession.create({
      data: { id: sessionId, scenario, language: lang, expiresAt },
    });
  } catch {
    return problem(503, "Session store unavailable", "SH-GUARDIAN-503", "Shield could not open a session. Call back on a number you saved.");
  }

  return ok({
    sessionId,
    language: lang,
    challengeWords: words,
    disclosure: script.disclosure,
    challengeLine: script.challenge,
    thanks: script.thanks,
    // 8–14 s answer window, compressed in the demo timeline.
    answerWindowSec: 8,
    expiresAt: expiresAt.toISOString(),
  });
}

/** Deterministic server-side scenario, used when no media fork supplied one. */
function pickScenario(seed: string): string {
  const scenarios = ["real_relative", "realtime_clone", "tts_operator", "caller_left"];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return scenarios[h % scenarios.length];
}

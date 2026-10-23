import { z } from "zod";
import { ok, problem } from "@/lib/api";
import { GUARDIAN_SCRIPT, pickChallengeWords, type GuardianLang } from "@/lib/shield-engine";

export const dynamic = "force-dynamic";

const Body = z.object({ language: z.enum(["en", "sw", "lg"]) });

/**
 * POST /api/guardian/session — the private brief before the merge.
 * The server picks the challenge words; the agent receives them as dynamic
 * variables and never chooses them itself (03, section 3.1).
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return problem(400, "Invalid JSON body", "SH-BODY-400");
  }
  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return problem(422, "Invalid request", "SH-GUARDIAN-422", "language must be en, sw or lg.");
  }
  const lang = parsed.data.language as GuardianLang;
  const sessionId = "gs_" + Math.random().toString(36).slice(2, 10);
  const words = pickChallengeWords(lang, sessionId);
  const script = GUARDIAN_SCRIPT[lang];

  return ok({
    sessionId,
    language: lang,
    challengeWords: words,
    disclosure: script.disclosure,
    challengeLine: script.challenge,
    thanks: script.thanks,
    // 8–14 s answer window, compressed in the demo timeline.
    answerWindowSec: 8,
    expiresAt: new Date(Date.now() + 90_000).toISOString(),
  });
}

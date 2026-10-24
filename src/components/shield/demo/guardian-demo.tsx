"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, PhoneCall, PhoneOff, BellRing, Users, Bot, Keyboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerdictCard, VerdictGlyph, HapticPulses, type VerdictResult } from "../verdict";
import { ConsoleButton, ConsoleFrame, LogLine, RunLog } from "./console-ui";
import { VERDICT_META, type GuardianLang, type GuardianScenario } from "@/lib/shield-engine";

type Phase = "idle" | "live" | "done";

interface SessionResponse {
  sessionId: string;
  challengeWords: string[];
  disclosure: string;
  challengeLine: string;
  thanks: string;
}

interface CompleteResponse extends VerdictResult {
  verdictWord: string;
  deliveredVia: string[];
  hapticPulses: number;
  inCallLatencyMs: number;
}

const LANGS: { id: GuardianLang; label: string }[] = [
  { id: "en", label: "English" },
  { id: "sw", label: "Kiswahili" },
  { id: "lg", label: "Luganda" },
];

const SCENARIOS: { id: GuardianScenario; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "real_relative", label: "A real relative", desc: "answers easily, human detectors stay quiet", icon: <Users className="size-3.5" /> },
  { id: "realtime_clone", label: "Real-time clone", desc: "passes the words, but detectors flag the voice", icon: <Bot className="size-3.5" /> },
  { id: "tts_operator", label: "TTS operator", desc: "types the words — latency and accuracy give it away", icon: <Keyboard className="size-3.5" /> },
  { id: "caller_left", label: "Hangs up at disclosure", desc: "caution, never danger on its own (B2)", icon: <LogOut className="size-3.5" /> },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function GuardianDemo() {
  const [lang, setLang] = useState<GuardianLang>("en");
  const [scenario, setScenario] = useState<GuardianScenario>("realtime_clone");
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [lines, setLines] = useState<React.ReactNode[]>([]);
  const [result, setResult] = useState<CompleteResponse | null>(null);
  const [spoken, setSpoken] = useState<number>(-1);
  const [windowPct, setWindowPct] = useState(0);
  const runId = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // When the private result lands, bring it into view — the timeline below
  // the controls is easy to miss otherwise. Skipped for reduced-motion users.
  useEffect(() => {
    if (step !== 7) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [step]);

  const push = (line: React.ReactNode) => setLines((prev) => [...prev, line]);

  async function start() {
    const id = ++runId.current;
    const alive = () => runId.current === id;

    setPhase("live");
    setStep(0);
    setLines([]);
    setResult(null);
    setSpoken(-1);
    setWindowPct(0);

    const res = await fetch("/api/guardian/session/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: lang, scenario }),
    });
    if (!alive()) return;
    const data = (await res.json()) as SessionResponse;
    setSession(data);

    // 1 · Merge
    await sleep(500);
    if (!alive()) return;
    setStep(1);
    push(<LogLine id="BRIEF">private brief accepted · session {data.sessionId}</LogLine>);
    await sleep(450);
    if (!alive()) return;
    setStep(2);
    push(<LogLine id="MERGE">Shield&rsquo;s local number merged into the call</LogLine>);

    // 2 · Disclosure
    await sleep(600);
    if (!alive()) return;
    setStep(3);
    push(<LogLine id="G-5">disclosure — first sentence says it is an AI ({lang.toUpperCase()})</LogLine>);

    // 3 · Challenge
    await sleep(900);
    if (!alive()) return;
    setStep(4);
    push(<LogLine id="CHAL">start_challenge · scoring window opens</LogLine>);
    for (let i = 0; i < data.challengeWords.length; i++) {
      await sleep(650);
      if (!alive()) return;
      setSpoken(i);
    }

    // 4 · Answer window
    await sleep(500);
    if (!alive()) return;
    setStep(5);
    for (let p = 0; p <= 100; p += 5) {
      setWindowPct(p);
      await sleep(70);
      if (!alive()) return;
    }
    push(<LogLine id="MRK">media fork scored: detectors · response latency · repeat accuracy · voice count</LogLine>);

    // 5 · Close — the agent only ever hears "recorded" (G-4)
    setStep(6);
    push(<LogLine id="G-4">close_challenge → recorded — the agent never learns the result</LogLine>);
    await sleep(500);
    if (!alive()) return;

    const comp = await fetch("/api/guardian/complete/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: data.sessionId, language: lang }),
    });
    if (!alive()) return;
    const verdict = (await comp.json()) as CompleteResponse;
    push(
      <LogLine id="ENG" state={verdict.verdict === "clear" ? "ok" : "flag"}>
        engine fused signals → verdict <b>{verdict.verdict}</b> · {verdict.inCallLatencyMs} ms after end of speech
      </LogLine>,
    );

    // 6 · Private result
    await sleep(500);
    if (!alive()) return;
    setStep(7);
    setResult(verdict);

    // 7 · Leave
    await sleep(900);
    if (!alive()) return;
    setStep(8);
    push(<LogLine id="END">end_call — Shield&rsquo;s leg only. The user&rsquo;s call continues.</LogLine>);
    setPhase("done");
  }

  const stepLabels = ["Brief", "Merged", "Disclosed", "Challenge", "Scoring", "Closed", "Result", "Left"];

  return (
    <ConsoleFrame
      title="live call guardian"
      right={<span className="hidden md:inline">merge · challenge · leave</span>}
    >
      <p className="text-sm leading-relaxed text-console-ink/75">
        Merge Shield into a suspicious call. An ElevenLabs agent introduces itself, asks the caller
        to repeat a few random words, then leaves — and the verdict reaches you privately. The
        agent talks; the engine decides.
      </p>

      {/* Demo controls */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-console-ink/50">call language</p>
          <div className="mt-2 flex gap-2">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLang(l.id)}
                disabled={phase === "live"}
                className={cn(
                  "min-h-9 rounded-full border px-4 text-sm font-medium transition-all disabled:opacity-50",
                  lang === l.id
                    ? "border-verdict-verified/60 bg-verdict-verified/15 text-verdict-verified"
                    : "border-console-line bg-white/[0.03] text-console-ink/70 hover:text-console-ink",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-console-ink/50">
            demo control — who is really on the line?
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setScenario(s.id)}
                disabled={phase === "live"}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left transition-all disabled:opacity-50",
                  scenario === s.id
                    ? "border-verdict-verified/60 bg-verdict-verified/10"
                    : "border-console-line bg-white/[0.03] hover:border-console-ink/30",
                )}
              >
                <span className={cn("flex items-center gap-1.5 text-xs font-semibold", scenario === s.id ? "text-verdict-verified" : "text-console-ink/80")}>
                  {s.icon}
                  {s.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-console-ink/50">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ConsoleButton onClick={start} disabled={phase === "live"} className="w-full sm:w-auto">
          {phase === "live" ? <Loader2 className="size-4 animate-spin" /> : <PhoneCall className="size-4" />}
          {phase === "live" ? "Guardian on the call…" : "Add Shield to this call"}
        </ConsoleButton>
      </div>

      {/* Stepper */}
      {phase !== "idle" && (
        <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1.5" aria-label="Guardian timeline">
          {stepLabels.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full border font-mono text-[10px]",
                  step > i && "border-verdict-verified bg-verdict-verified/20 text-verdict-verified",
                  step === i + 1 && "border-verdict-verified text-verdict-verified animate-blink",
                  step <= i && step !== i + 1 && "border-console-line text-console-ink/35",
                )}
              >
                {step > i ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={cn("font-mono text-[10.5px] uppercase tracking-wider", step > i ? "text-console-ink/85" : "text-console-ink/40")}>
                {label}
              </span>
              {i < stepLabels.length - 1 && <span className="text-console-ink/25" aria-hidden>—</span>}
            </li>
          ))}
        </ol>
      )}

      <RunLog lines={lines} />

      {/* Call transcript bubbles */}
      {session && step >= 3 && (
        <div className="mt-5 space-y-3 rounded-xl border border-console-line bg-black/25 p-4">
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-console-line bg-white/[0.05] px-4 py-2.5">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-console-ink/45">guardian · ai disclosed</p>
              <p className="mt-1 text-sm text-console-ink/90">{session.disclosure}</p>
            </div>
          </div>
          {step >= 4 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm border border-verdict-verified/30 bg-verdict-verified/10 px-4 py-2.5">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-verdict-verified/80">challenge · repeat after me</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {session.challengeWords.map((w, i) => (
                    <span
                      key={w}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 font-mono text-sm transition-all duration-300",
                        spoken >= i
                          ? "border-verdict-verified/60 bg-verdict-verified/20 text-verdict-verified"
                          : "border-console-line text-console-ink/40",
                      )}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {step >= 5 && (
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-verdict-verified transition-all duration-100" style={{ width: `${windowPct}%` }} />
              </div>
              <p className="mt-1.5 font-mono text-[10.5px] text-console-ink/50">
                answer window — you stay quiet while they answer
              </p>
            </div>
          )}
          {step >= 6 && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-sm border border-console-line bg-white/[0.05] px-4 py-2.5">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-console-ink/45">caller</p>
                <p className="mt-1 text-sm italic text-console-ink/60">
                  {scenario === "caller_left"
                    ? "…the caller hung up when Shield joined."
                    : scenario === "tts_operator"
                      ? "ka… kapu… mto… (a pause, then the words — typed, not spoken)"
                      : "…repeating the words"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Private result notification */}
      <div ref={resultRef}>
        {result && step >= 7 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          {/* Phone mock */}
          <div className="mx-auto w-full max-w-[300px] rounded-[26px] border border-console-line bg-black/40 p-3">
            <div className="rounded-[20px] border border-console-line bg-console-ink/[0.06] p-4">
              <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.2em] text-console-ink/40">your phone · private</p>
              <div className="animate-line-in mt-3 rounded-2xl border border-border/60 bg-card p-3.5 text-foreground shadow-lg">
                <div className="flex items-center gap-2">
                  <VerdictGlyph verdict={result.verdict as VerdictResult["verdict"]} size={22} strokeWidth={2.6} />
                  <p className="text-xs font-bold">SecureVoice Shield</p>
                  <span className="ml-auto font-mono text-[9.5px] text-muted-foreground">now</span>
                </div>
                <p className={cn("mt-2 text-sm font-bold leading-snug", "text-foreground")}>
                  {result.verdictWord}
                  {VERDICT_META[result.verdict as keyof typeof VERDICT_META].name !== result.verdictWord && (
                    <span className="text-muted-foreground"> · {VERDICT_META[result.verdict as keyof typeof VERDICT_META].name}</span>
                  )}
                </p>
                <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">
                  {result.reasonCopy?.[0] ?? VERDICT_META[result.verdict as keyof typeof VERDICT_META].wording}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <HapticPulses count={result.hapticPulses} className="text-foreground" />
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">
                    via {result.deliveredVia.join(" + ")}
                  </span>
                </div>
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center font-mono text-[9.5px] uppercase tracking-[0.14em] text-console-ink/45">
                <PhoneOff className="size-3" /> the caller never sees this
              </p>
            </div>
          </div>

          <VerdictCard
            result={{
              verdict: result.verdict as VerdictResult["verdict"],
              reasons: result.reasons,
              reasonCopy: result.reasonCopy,
              latencyMs: result.inCallLatencyMs,
            }}
            title="Private result — engine verdict"
            footer={
              <p className="mt-3 flex items-start gap-2 border-t border-border/70 pt-3 text-sm text-muted-foreground">
                <BellRing className="mt-0.5 size-4 shrink-0 text-primary" />
                Deadline check: the sandbox&rsquo;s scripted in-call latency is{" "}
                {result.inCallLatencyMs} ms — the RT-0 budget is 1.5 s.
              </p>
            }
          />
        </div>
      )}
      </div>

      {phase === "done" && step >= 8 && (
        <p className="mt-5 rounded-xl border border-console-line bg-white/[0.03] p-4 text-sm text-console-ink/80">
          <b>What just happened:</b> the agent only ran the script — it never knew the verdict, never
          asked for a code, and every number it could say comes from a registry. Shield left the
          call; the verdict arrived privately. If the merge had failed, Shield would have offered
          Ask-it-yourself instead.
        </p>
      )}
    </ConsoleFrame>
  );
}

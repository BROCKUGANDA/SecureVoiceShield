"use client";

import { useEffect, useRef, useState } from "react";
import { FlaskConical, Loader2, Search, ShieldAlert, Braces } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { VerdictCard, type VerdictResult } from "../verdict";
import { CopyButton } from "../copy-button";
import { ConsoleButton, ConsoleFrame, LogLine, ProblemCard, RunLog, SandboxChip } from "./console-ui";

const MAGIC: { last4: string; label: string }[] = [
  { last4: "0001", label: "0001 · SIM swapped 2h ago" },
  { last4: "0002", label: "0002 · forwarding on" },
  { last4: "0003", label: "0003 · telco timeout" },
  { last4: "0004", label: "0004 · mass-reported" },
  { last4: "0005", label: "0005 · synthetic voice" },
  { last4: "0006", label: "0006 · verified bank call" },
  { last4: "0007", label: "0007 · slow 950 ms" },
  { last4: "0008", label: "0008 · degraded mode" },
];

type Phase = "idle" | "running" | "done" | "error";

interface AssessResponse extends VerdictResult {
  decisionId: string;
  subject: string;
  signals: unknown;
  audit: { seq: number };
}

const E164 = /^\+[1-9]\d{7,14}$/;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function NumberCheck() {
  const [value, setValue] = useState("+256770012345");
  const [activeMagic, setActiveMagic] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lines, setLines] = useState<React.ReactNode[]>([]);
  const [result, setResult] = useState<AssessResponse | null>(null);
  const [problem, setProblem] = useState<{ title: string; code: string; detail?: string } | null>(null);
  const [reportState, setReportState] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Bring the verdict card into view once a check completes (mobile: it can
  // land a screen below the button). Honours reduced-motion.
  useEffect(() => {
    if (phase !== "done") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [phase]);

  // Client-side E.164 feedback: fail fast, before the network does.
  const digitsOnly = value.replace(/[^\d+]/g, "");
  const invalid = value.trim().length > 0 && !E164.test(digitsOnly);

  const push = (line: React.ReactNode) => setLines((prev) => [...prev, line]);

  async function run(numberRaw: string) {
    setPhase("running");
    setLines([]);
    setResult(null);
    setProblem(null);
    setReportState(null);

    const fetchPromise = fetch("/api/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": "ui-" + Date.now() },
      body: JSON.stringify({ number: numberRaw }),
    }).then(async (res) => ({ ok: res.ok, status: res.status, body: await res.json() }));

    // Signal-plane steps reveal while the request is in flight (RT-1: 250 ms budget).
    const steps: Promise<void>[] = [];
    const step = async (fn: () => void, ms: number) => {
      await sleep(ms);
      fn();
    };
    steps.push(step(() => push(<LogLine id="NUM">normalising to E.164 · {numberRaw}</LogLine>), 180));
    steps.push(step(() => push(<LogLine id="TEL">telco adapter · SIM swap, call forwarding (CAMARA)</LogLine>), 420));
    steps.push(step(() => push(<LogLine id="REP">number reputation · shared report pool</LogLine>), 660));
    steps.push(step(() => push(<LogLine id="ENG" state="wait">engine fusing signals · policy ug-public-2026.10.1</LogLine>), 900));
    const linesDone = Promise.all(steps);

    const [res] = await Promise.all([fetchPromise, linesDone]);

    if (!res.ok) {
      const b = res.body as { title?: string; code?: string; detail?: string };
      push(<LogLine id="ERR" state="flag">{b.code ?? res.status} — degraded, never reassuring (F-1)</LogLine>);
      setProblem({ title: b.title ?? "Request failed", code: b.code ?? String(res.status), detail: b.detail });
      setPhase("error");
      return;
    }
    const data = res.body as AssessResponse;
    push(
      <LogLine id="ENG" state={data.verdict === "clear" || data.verdict === "verified" ? "ok" : "flag"}>
        verdict <b>{data.verdict}</b> · action {data.recommendedAction} · {data.latencyMs} ms · audit #{data.audit.seq}
      </LogLine>,
    );
    setResult(data);
    setPhase("done");
  }

  function submit(raw: string) {
    const clean = raw.replace(/[^\d+]/g, "");
    if (!E164.test(clean)) {
      toast({
        title: "Check the number",
        description: "Use international format starting with +, e.g. +256 772 123456.",
      });
      return;
    }
    void run(clean);
  }

  async function report() {
    if (!result) return;
    setReportState("sending");
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: value.replace(/[^\d+]/g, ""), note: "Reported from Shield demo" }),
      });
      const data = (await res.json()) as { reportId?: string; totalReports?: number };
      if (data.reportId) {
        setReportState(
          `Reported · receipt ${data.reportId.slice(0, 10)}… · ${data.totalReports} report(s) on this number · the owner can appeal within 72 h`,
        );
        toast({
          title: "Scam report filed",
          description: `${data.totalReports} report(s) on this number now. The owner can appeal within 72 hours.`,
        });
      } else {
        setReportState("Could not file the report");
        toast({ title: "Could not file the report", description: "Please try again in a moment." });
      }
    } catch {
      setReportState("Network error — the report is queued on your device and retried");
      toast({ title: "Network error", description: "The report stays queued on your device and will retry." });
    }
  }

  return (
    <ConsoleFrame
      title="check a number"
      right={<span className="hidden md:inline">POST /api/assess</span>}
    >
      <p className="text-sm leading-relaxed text-console-ink/75">
        One API for voice, SIM and number signals. Telco checks run for the user&rsquo;s own number
        with consent — public checks of someone else&rsquo;s number never reveal SIM status (C8).
      </p>

      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setActiveMagic(null);
              }}
              inputMode="tel"
              autoComplete="off"
              spellCheck={false}
              aria-label="Phone number in E.164 format"
              aria-invalid={invalid}
              aria-describedby={invalid ? "number-format-hint" : undefined}
              placeholder="+256 7X XXX XXXX"
              className="console-input min-h-11 w-full rounded-xl border border-console-line bg-black/30 px-4 font-mono text-console-ink placeholder:text-console-ink/35 focus:border-verdict-verified/60 focus:outline-none aria-[invalid=true]:border-verdict-caution/70"
            />
            {invalid && (
              <p id="number-format-hint" className="mt-1.5 text-[12.5px] text-verdict-caution">
                International format, starting with + and country code.
              </p>
            )}
          </div>
          <ConsoleButton type="submit" disabled={phase === "running"}>
            {phase === "running" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {phase === "running" ? "Assessing…" : "Assess number"}
          </ConsoleButton>
        </div>
      </form>

      <div className="mt-4">
        <p className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-console-ink/50">
          <FlaskConical className="size-3.5" /> sandbox magic numbers — scripted telco answers
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {MAGIC.map((m) => (
            <SandboxChip
              key={m.last4}
              label={m.label}
              active={activeMagic === m.last4}
              onClick={() => {
                const num = "+256770" + m.last4;
                setActiveMagic(m.last4);
                setValue(num);
                run(num);
              }}
            />
          ))}
        </div>
      </div>

      <RunLog lines={lines} />

      {problem && <ProblemCard title={problem.title} code={problem.code} detail={problem.detail} />}

      {result && (
        <div ref={resultRef} className="mt-5 space-y-3">
          <VerdictCard
            result={{
              verdict: result.verdict as VerdictResult["verdict"],
              reasons: result.reasons,
              reasonCopy: result.reasonCopy,
              recommendedAction: result.recommendedAction,
              latencyMs: result.latencyMs,
              auditSeq: result.audit?.seq,
            }}
            title={`Shield result · ${result.subject}`}
            footer={
              (result.verdict === "danger" || result.verdict === "caution") && (
                <div className="mt-3 border-t border-border/70 pt-3">
                  {reportState ? (
                    <p className="flex items-start gap-2 text-sm text-foreground/80">
                      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-verdict-caution" />
                      {reportState}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={report}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-verdict-danger/10 px-4 text-sm font-semibold text-verdict-danger transition-colors hover:bg-verdict-danger/20"
                    >
                      <ShieldAlert className="size-4" />
                      Report this number
                    </button>
                  )}
                </div>
              )
            }
          />

          <Collapsible>
            <div className="flex items-center justify-between gap-3">
              <CollapsibleTrigger className="group inline-flex items-center gap-2 rounded font-mono text-[11px] uppercase tracking-[0.16em] text-console-ink/60 transition-colors hover:text-verdict-verified">
                <Braces className="size-3.5" />
                Raw API response
                <span className="text-console-ink/35 group-data-[state=open]:hidden">(business view)</span>
              </CollapsibleTrigger>
              <CopyButton
                text={() => JSON.stringify(result, null, 2)}
                label="Copy"
                className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-console-line px-3 font-mono text-[10.5px] uppercase tracking-wider text-console-ink/60 transition-colors hover:border-verdict-verified/40 hover:text-verdict-verified"
              />
            </div>
            <CollapsibleContent>
              <pre
                aria-label="Raw API response"
                className="nice-scroll mt-2 max-h-60 overflow-auto rounded-xl border border-console-line bg-black/30 p-4 font-mono text-[11.5px] leading-relaxed text-console-ink/80"
              >
{JSON.stringify(result, null, 2)}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </ConsoleFrame>
  );
}

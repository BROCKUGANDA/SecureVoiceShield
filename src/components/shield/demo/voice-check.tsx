"use client";

import { useRef, useState } from "react";
import { AudioLines, FileAudio2, Loader2, Lock, Trash2 } from "lucide-react";
import { VerdictCard, type VerdictResult } from "../verdict";
import { ConsoleButton, ConsoleFrame, LogLine, ProblemCard, RunLog, SandboxChip } from "./console-ui";

type Phase = "idle" | "running" | "done" | "error";

interface VoiceResponse extends VerdictResult {
  checkId: string;
  detectors: { d1ElevenLabs: string; d2Vendor: string; d3InHouse: string };
  durationSec: number;
  audioDeletedAfterSec: number;
}

interface Sample {
  fileName: string;
  sizeKb: number;
  durationSec: number;
  preset?: string;
  label: string;
}

const SAMPLES: Sample[] = [
  { fileName: "family-emergency.m4a", sizeKb: 210, durationSec: 9, preset: "family-emergency.m4a", label: "\u201CMum, I\u2019m in trouble\u201D — forwarded voice note" },
  { fileName: "mum-real-voice.ogg", sizeKb: 180, durationSec: 11, preset: "mum-real-voice.ogg", label: "A real voice note from Mum" },
  { fileName: "forwarded-3x.opus", sizeKb: 9, durationSec: 7, label: "Forwarded 3× — too degraded" },
  { fileName: "tiny-clip.m4a", sizeKb: 30, durationSec: 2, label: "2-second clip" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function VoiceCheck() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [lines, setLines] = useState<React.ReactNode[]>([]);
  const [result, setResult] = useState<VoiceResponse | null>(null);
  const [problem, setProblem] = useState<{ title: string; code: string; detail?: string } | null>(null);
  const [activeName, setActiveName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const push = (line: React.ReactNode) => setLines((prev) => [...prev, line]);

  async function run(input: { fileName: string; sizeKb: number; durationSec: number; preset?: string }) {
    setPhase("running");
    setLines([]);
    setResult(null);
    setProblem(null);
    setActiveName(input.fileName);

    const fetchPromise = fetch("/api/voice-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }).then(async (res) => ({ ok: res.ok, status: res.status, body: await res.json() }));

    const steps: Promise<void>[] = [];
    const step = async (fn: () => void, ms: number) => {
      await sleep(ms);
      fn();
    };
    steps.push(step(() => push(<LogLine id="DEC">decoding Opus → 16 kHz mono · {input.durationSec}s</LogLine>), 160));
    steps.push(step(() => push(<LogLine id="VAD">voice activity · speech found, one speaker</LogLine>), 380));
    steps.push(step(() => push(<LogLine id="D1">ElevenLabs AI Speech Classifier (provider-scoped)</LogLine>), 620));
    steps.push(step(() => push(<LogLine id="D2">independent deepfake detector #2</LogLine>), 860));
    steps.push(step(() => push(<LogLine id="D3">in-house detector · XLS-R front-end</LogLine>), 1100));
    steps.push(step(() => push(<LogLine id="CUE">scam-script cues · urgency, OTP asks, payment rails</LogLine>), 1340));
    steps.push(step(() => push(<LogLine id="ENG" state="wait">fusion — at least two general detectors must agree</LogLine>), 1580));
    const linesDone = Promise.all(steps);

    const [res] = await Promise.all([fetchPromise, linesDone]);

    if (!res.ok) {
      const b = res.body as { title?: string; code?: string; detail?: string };
      push(<LogLine id="ERR" state="flag">{b.code ?? res.status} — fail toward Inconclusive, never Clear</LogLine>);
      setProblem({ title: b.title ?? "Request failed", code: b.code ?? String(res.status), detail: b.detail });
      setPhase("error");
      return;
    }
    const data = res.body as VoiceResponse;
    const d = data.detectors;
    push(
      <LogLine id="ENG">
        verdict <b>{data.verdict}</b> · D1 {d.d1ElevenLabs} · D2 {d.d2Vendor} · D3 {d.d3InHouse}
      </LogLine>,
    );
    push(<LogLine id="PRV" state="dim">audio crypto-shredded · deleted {data.audioDeletedAfterSec}s after scoring</LogLine>);
    setResult(data);
    setPhase("done");
  }

  async function onFile(file: File) {
    let durationSec = 9;
    try {
      durationSec = await new Promise<number>((resolve) => {
        const audio = new Audio(URL.createObjectURL(file));
        audio.addEventListener("loadedmetadata", () => resolve(Number.isFinite(audio.duration) ? audio.duration : 9));
        audio.addEventListener("error", () => resolve(9));
        setTimeout(() => resolve(Number.isFinite(audio.duration) ? audio.duration : 9), 1500);
      });
    } catch {
      durationSec = 9;
    }
    run({ fileName: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), durationSec: Math.round(durationSec) });
  }

  return (
    <ConsoleFrame
      title="check a voice note"
      right={<span className="hidden md:inline">POST /api/voice-check</span>}
    >
      <p className="text-sm leading-relaxed text-console-ink/75">
        Forward a suspicious voice note and get a traffic-light answer in plain language. Two
        independent detectors must agree before anything is called synthetic — and a voice note
        can always be recorded earlier, so the advice is to call back on a number you saved.
      </p>

      <div className="mt-5">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-console-ink/50">try a sample</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <SandboxChip
              key={s.fileName}
              label={s.label}
              active={activeName === s.fileName}
              onClick={() => run({ fileName: s.fileName, sizeKb: s.sizeKb, durationSec: s.durationSec, preset: s.preset })}
            />
          ))}
          <SandboxChip
            label="upload your own audio"
            active={false}
            onClick={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            aria-label="Upload an audio file to check"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-console-line bg-white/[0.03] p-4">
        <FileAudio2 className="size-5 text-console-ink/60" />
        <p className="flex-1 text-sm text-console-ink/80">
          {activeName ? (
            <>Checking <span className="font-mono text-console-ink">{activeName}</span></>
          ) : (
            "Nothing loaded yet — pick a sample or upload a clip."
          )}
        </p>
        <ConsoleButton
          variant={activeName ? "ghost" : "primary"}
          onClick={() => {
            const s = SAMPLES[0];
            run({ fileName: s.fileName, sizeKb: s.sizeKb, durationSec: s.durationSec, preset: s.preset });
          }}
          disabled={phase === "running"}
        >
          {phase === "running" ? <Loader2 className="size-4 animate-spin" /> : <AudioLines className="size-4" />}
          Run check
        </ConsoleButton>
      </div>

      <RunLog lines={lines} />

      {problem && <ProblemCard title={problem.title} code={problem.code} detail={problem.detail} />}

      {result && (
        <div className="mt-5 space-y-3">
          <VerdictCard
            result={{
              verdict: result.verdict as VerdictResult["verdict"],
              reasons: result.reasons,
              reasonCopy: result.reasonCopy,
              recommendedAction: result.recommendedAction,
              latencyMs: undefined,
              auditSeq: undefined,
            }}
            title={`Shield result · check ${result.checkId}`}
            footer={
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border/70 pt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Trash2 className="size-3.5 text-verdict-verified" />
                  Audio deleted {result.audioDeletedAfterSec}s after scoring
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="size-3.5" />
                  No voiceprint of any person is stored
                </span>
              </div>
            }
          />
        </div>
      )}
    </ConsoleFrame>
  );
}

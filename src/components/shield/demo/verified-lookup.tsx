"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Loader2, PhoneIncoming, Search, ShieldX } from "lucide-react";
import { VerdictCard, VerdictGlyph } from "../verdict";
import { ConsoleButton, ConsoleFrame, SandboxChip } from "./console-ui";

type Phase = "idle" | "running" | "done";

interface LookupOk {
  subject: string;
  registered: true;
  bank: string;
  market: string;
  wording: string;
  registeredMinutesAgo: number;
}

interface LookupMiss {
  subject: string;
  registered: false;
  advice: string;
}

export function VerifiedLookup() {
  const [value, setValue] = useState("+256417303000");
  const [phase, setPhase] = useState<Phase>("idle");
  const [ok, setOk] = useState<LookupOk | null>(null);
  const [miss, setMiss] = useState<LookupMiss | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "done") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }, [phase]);

  async function run() {
    setPhase("running");
    setOk(null);
    setMiss(null);
    try {
      const res = await fetch(`/api/verified-calls/?number=${encodeURIComponent(value)}`, { cache: "no-store" });
      const data = (await res.json()) as LookupOk | LookupMiss;
      if (data.registered) setOk(data);
      else setMiss(data);
    } catch {
      setMiss({ subject: value, registered: false, advice: "Network error. Hang up and call your bank on the number on your card." });
    }
    setPhase("done");
  }

  return (
    <ConsoleFrame
      title="was that call real?"
      right={<span className="hidden md:inline">GET /api/verified-calls</span>}
    >
      <p className="text-sm leading-relaxed text-console-ink/75">
        When your bank — or SecureVoice AI — really calls, the bank registers the call in advance
        and your app shows <b>&ldquo;Your bank is calling you now.&rdquo;</b> No banner? Hang up.
        Spoofed caller ID can&rsquo;t fake a registry entry.
      </p>

      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="tel"
            autoComplete="off"
            spellCheck={false}
            aria-label="Phone number that called you, in E.164 format"
            placeholder="Number that called you"
            className="console-input min-h-11 flex-1 rounded-xl border border-console-line bg-black/30 px-4 font-mono text-console-ink placeholder:text-console-ink/35 focus:border-verdict-verified/60 focus:outline-none"
          />
          <ConsoleButton type="submit" disabled={phase === "running"}>
            {phase === "running" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Check the caller
          </ConsoleButton>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SandboxChip
          label="try a registered bank line · +971 4 XXX XXXX"
          onClick={() => {
            setValue("+971420160000");
            setPhase("idle");
            setOk(null);
            setMiss(null);
          }}
        />
        <SandboxChip
          label="any number ending 0006 registers as a call in progress"
          onClick={() => {
            setValue("+254700000006");
            setPhase("idle");
            setOk(null);
            setMiss(null);
          }}
        />
      </div>

      <div ref={resultRef}>
        {ok && (
        <div className="animate-line-in mt-5 rounded-2xl border border-verdict-verified/40 bg-verdict-verified/10 p-5">
          <div className="flex items-start gap-4">
            <VerdictGlyph verdict="verified" size={52} />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-verdict-verified">verified call</p>
              <p className="mt-0.5 flex items-center gap-2 text-lg font-semibold leading-tight text-verdict-verified">
                {ok.wording} <BadgeCheck className="size-5" />
              </p>
              <p className="mt-2 text-sm text-console-ink/80">
                Registered {ok.registeredMinutesAgo} minutes ago by {ok.bank} ({ok.market}). An AI
                agent from the bank can still be a verified call.
              </p>
              <p className="mt-3 flex items-center gap-2 border-t border-verdict-verified/20 pt-3 text-sm text-console-ink/70">
                <PhoneIncoming className="size-4 text-verdict-verified" />
                Your phone would show this banner while it rings.
              </p>
            </div>
          </div>
        </div>
      )}

      {miss && (
        <div className="animate-line-in mt-5 rounded-2xl border border-verdict-caution/40 bg-verdict-caution/10 p-5">
          <div className="flex items-start gap-4">
            <VerdictGlyph verdict="inconclusive" size={52} />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-verdict-caution">not registered</p>
              <p className="mt-0.5 text-lg font-semibold leading-tight text-verdict-caution">We can&rsquo;t confirm this call.</p>
              <p className="mt-2 flex items-start gap-2 text-sm text-console-ink/85">
                <ShieldX className="mt-0.5 size-4 shrink-0 text-verdict-caution" />
                {miss.advice}
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </ConsoleFrame>
  );
}

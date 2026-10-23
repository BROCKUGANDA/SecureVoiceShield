import { ArrowRight, BookOpenCheck, Ban, Smartphone, Radio, MessageCircle, Vibrate } from "lucide-react";
import { VerdictGlyph, HapticPulses } from "./verdict";

export function Hero() {
  return (
    <section className="bg-blueprint relative overflow-hidden border-b border-border/70">
      <div className="pointer-events-none absolute -top-40 right-[-10%] size-[540px] rounded-full bg-secondary/70 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-30%] left-[-8%] size-[420px] rounded-full bg-accent/60 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        {/* Copy */}
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
            A sister product to SecureVoice AI
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.06] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            When a voice lies,
            <br />
            <span className="relative inline-block text-primary">
              Shield answers.
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 220 12"
                fill="none"
                aria-hidden
                preserveAspectRatio="none"
              >
                <path d="M3 9C60 3 150 3 217 8" stroke="var(--verdict-verified)" strokeWidth="4" strokeLinecap="round" opacity="0.55" />
              </svg>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Scammers clone voices, spoof numbers and swap SIMs to pretend to be your relative,
            your boss or your bank. Shield protects the customer <em>and</em> the bank — scoring
            every suspicious call, voice note and one-time-passcode request, and answering in
            plain language.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#demo"
              className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-[0_10px_28px_-12px_rgba(18,83,63,0.65)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-12px_rgba(18,83,63,0.55)]"
            >
              Try the live sandbox
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#signals"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <BookOpenCheck className="size-4 text-primary" />
              How detection works
            </a>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
            {[
              ["4", "markets · AE KE UG TZ"],
              ["11", "locales, incl. Luganda"],
              ["1.5 s", "in-call verdict deadline"],
              ["60 s", "audio, then deleted"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="text-2xl font-bold tracking-tight text-foreground">{v}</dd>
                <dd className="mt-0.5 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Visual: signal console */}
        <div className="relative mx-auto w-full max-w-[520px]" aria-hidden>
          <div className="relative rounded-3xl border border-console-line bg-console p-6 shadow-[0_30px_80px_-30px_rgba(14,25,19,0.55)] sm:p-8">
            <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.18em] text-console-ink/50">
              <span>signal plane · cell ug</span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-verdict-clear animate-blink" />
                streaming
              </span>
            </div>

            {/* Radar + shield */}
            <div className="relative mx-auto mt-6 grid size-56 place-items-center sm:size-64">
              <span className="animate-radar absolute size-40 rounded-full border border-verdict-verified/50" />
              <span className="animate-radar-delay-1 absolute size-40 rounded-full border border-verdict-verified/50" />
              <span className="animate-radar-delay-2 absolute size-40 rounded-full border border-verdict-verified/50" />
              <span className="absolute size-40 rounded-full border border-console-line" />
              <VerdictGlyph verdict="verified" size={104} strokeWidth={1.9} />
              <span className="absolute -bottom-1 rounded-full border border-console-line bg-console px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-console-ink/80">
                guard · engine · verdict
              </span>
            </div>

            {/* Detector lanes */}
            <div className="mt-8 space-y-2.5 font-mono text-[11.5px] text-console-ink/85">
              {[
                ["D1", "ElevenLabs classifier", "clear"],
                ["D2", "independent detector", "clear"],
                ["D3", "in-house deepfake", "flag"],
                ["TEL", "SIM swap · forwarding", "clear"],
                ["CUE", "scam-script pressure", "flag"],
              ].map(([id, label, state], i) => (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg border border-console-line px-3 py-2"
                  style={{ animationDelay: `${i * 0.12}s` }}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-8 text-console-ink/45">{id}</span>
                    {label}
                  </span>
                  <span className={state === "flag" ? "text-verdict-caution" : "text-verdict-clear"}>
                    {state === "flag" ? "signal" : "ok"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-console-line bg-white/[0.03] px-4 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-console-ink/50">fused verdict</p>
                <p className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-verdict-caution">
                  <VerdictGlyph verdict="caution" size={18} strokeWidth={3} /> Caution — be careful
                </p>
              </div>
              <HapticPulses count={2} className="text-verdict-caution" />
            </div>
          </div>

          {/* Floating chips */}
          <div className="animate-float absolute -left-4 top-24 hidden rounded-2xl border border-border bg-card p-3 shadow-lg sm:block">
            <div className="flex items-center gap-2.5">
              <VerdictGlyph verdict="danger" size={30} />
              <div>
                <p className="text-xs font-bold text-verdict-danger">Danger</p>
                <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">3 pulses · octagon</p>
              </div>
            </div>
          </div>
          <div className="animate-float-slow absolute -right-3 bottom-24 hidden rounded-2xl border border-border bg-card p-3 shadow-lg sm:block">
            <div className="flex items-center gap-2.5">
              <VerdictGlyph verdict="verified" size={30} />
              <div>
                <p className="text-xs font-bold text-verdict-verified">Verified call</p>
                <p className="font-mono text-[9.5px] uppercase tracking-wider text-muted-foreground">bank registered</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Channel strip */}
      <div className="relative border-t border-border/70 bg-card/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-4 text-sm text-muted-foreground sm:justify-between sm:px-6">
          <span className="flex items-center gap-2"><MessageCircle className="size-4 text-primary" /> WhatsApp check bot</span>
          <span className="flex items-center gap-2"><Smartphone className="size-4 text-primary" /> Live Call Guardian merge</span>
          <span className="flex items-center gap-2"><Radio className="size-4 text-primary" /> USSD &amp; SMS — no data needed</span>
          <span className="flex items-center gap-2"><Vibrate className="size-4 text-primary" /> Haptic verdict patterns</span>
          <span className="flex items-center gap-2 text-verdict-danger"><Ban className="size-4" /> Never asks for a PIN or code</span>
        </div>
      </div>
    </section>
  );
}

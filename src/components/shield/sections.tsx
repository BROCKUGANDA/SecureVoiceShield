import {
  AudioWaveform,
  MessageSquareWarning,
  CardSim,
  BookOpenText,
  ShieldCheck,
  MessagesSquare,
  Bot,
  MonitorDot,
  ArrowDown,
  KeyRound,
  Timer,
  ScrollText,
  Lock,
  Globe2,
  Wifi,
  Radio,
  ServerCog,
  CircuitBoard,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { VerdictGlyph } from "./verdict";
import { VERDICT_META, type Verdict } from "@/lib/shield-engine";

/* ------------------------------------------------------------------ */
/* Stats strip                                                         */
/* ------------------------------------------------------------------ */

export function StatsStrip() {
  const stats = [
    { v: "17,152", l: "frauds & attempts reported to TCRA in one quarter (TZ, Q1 2025)" },
    { v: "80%+", l: "TTS operators caught by the live challenge (v1 target)" },
    { v: "< 2%", l: "false-red rate on genuine human voices (v1 target)" },
    { v: "< 10 s", l: "from a forwarded voice note to a plain-language reply" },
  ];
  return (
    <section aria-label="Why Shield exists" className="border-b border-border/70 bg-card/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.v} className="border-l-2 border-primary/30 pl-4">
            <p className="text-3xl font-extrabold tracking-tight">{s.v}</p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section shell                                                       */
/* ------------------------------------------------------------------ */

export function SectionHead({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {lede && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{lede}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The four signals                                                    */
/* ------------------------------------------------------------------ */

export function SignalsSection() {
  const signals = [
    {
      icon: <AudioWaveform className="size-5" />,
      id: "01 · audio forensics",
      title: "Does the audio look machine-made?",
      body: "At least two independent detectors scan every clip. One is the ElevenLabs AI Speech Classifier — 99% precision on its own audio — but it only knows ElevenLabs voices, so it is one signal, never the verdict.",
    },
    {
      icon: <MessageSquareWarning className="size-5" />,
      id: "02 · liveness",
      title: "Can it answer live?",
      body: "\u201CPlease repeat these words: basket, river, seven.\u201D Words are random per call, never numbers or dates. Real-time clones lag, glitch or drift; text-to-speech operators have to type — and typing shows.",
    },
    {
      icon: <CardSim className="size-5" />,
      id: "03 · the line",
      title: "Is the line trustworthy?",
      body: "Telco signals: a recent SIM swap, call forwarding switched on, number verification, VoIP posing as a mobile number. A swap is a risk signal — never proof on its own.",
    },
    {
      icon: <BookOpenText className="size-5" />,
      id: "04 · the story",
      title: "Does the story fit a scam?",
      body: "Urgency, secrecy, a new number (\u201Cmy phone broke\u201D), requests for one-time passcodes or PINs, payment by mobile money, gift cards or crypto. Story pressure adds risk — it can never clear anyone.",
    },
  ];
  return (
    <section id="signals" className="border-b border-border/70 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="How detection works"
          title="Four kinds of evidence. One cautious verdict."
          lede="Shield never relies on one test. Signals go into a deterministic, versioned rule pack — no model ever sits in a decision path."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {signals.map((s) => (
            <article
              key={s.id}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_16px_40px_-24px_rgba(18,83,63,0.4)]"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">{s.icon}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">{s.id}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-primary/25 bg-secondary/60 p-5">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-foreground/90">
            <b>The floor rule:</b> no single component can produce <i>Clear</i>. It needs every
            detector to answer, at least two general detectors agreeing, and no{" "}
            <span className="font-mono text-sm">unknown</span> signal. Missing or late evidence
            makes the answer more cautious — never more reassuring.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Verdict gallery                                                     */
/* ------------------------------------------------------------------ */

const VERDICT_ORDER: Verdict[] = ["clear", "caution", "danger", "inconclusive", "verified"];

const VERDICT_COLOR_WORD: Record<Verdict, string> = {
  clear: "Emerald",
  caution: "Amber",
  danger: "Red",
  inconclusive: "Slate",
  verified: "Deep green",
};

export function VerdictsSection() {
  return (
    <section id="verdicts" className="border-b border-border/70 bg-secondary/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Five verdicts"
          title="Shape, colour, word and haptic — never colour alone"
          lede="Every result pairs four channels so it works on a cracked phone, for a low-vision user, in any of eleven languages."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VERDICT_ORDER.map((v) => {
            const meta = VERDICT_META[v];
            return (
              <article key={v} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                <VerdictGlyph verdict={v} size={56} />
                <h3 className="mt-4 text-lg font-bold">{meta.name}</h3>
                <p className="mt-1 text-sm font-semibold text-foreground/85">{meta.wording}</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{meta.advice}</p>
                <p className="mt-4 border-t border-border/70 pt-3 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                  {meta.shape} · {VERDICT_COLOR_WORD[v]} · {meta.hapticPulses === 0 ? "no pulses" : `${meta.hapticPulses} pulse${meta.hapticPulses > 1 ? "s" : ""}`}
                </p>
              </article>
            );
          })}
          <article className="flex flex-col justify-center rounded-2xl border border-dashed border-primary/40 bg-primary/[0.04] p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-primary">the golden rule</p>
            <p className="mt-2 text-xl font-bold leading-snug">
              Shield never calls you first.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Any call claiming to be Shield is a scam. The best result Shield can give is
              &ldquo;No warning signs found&rdquo; — never &ldquo;definitely real&rdquo;.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

const PUBLIC_FEATURES = [
  { icon: <MessagesSquare className="size-4" />, t: "WhatsApp check bot", d: "Forward a suspicious voice note, get a traffic-light reply in your language — text plus an optional voice reply." },
  { icon: <Timer className="size-4" />, t: "Live Call Guardian", d: "Merge Shield into the call. It asks a liveness question, then leaves. The verdict reaches you privately." },
  { icon: <KeyRound className="size-4" />, t: "Ask-it-yourself", d: "No merge? Shield sends four random words by SMS, WhatsApp or USSD for you to ask the caller to repeat." },
  { icon: <Radio className="size-4" />, t: "USSD & SMS", d: "Check a number, confirm your bank is really calling, report a scam — no smartphone or data needed." },
  { icon: <Lock className="size-4" />, t: "Family safe word kit", d: "Guided setup of a secret family phrase. Shield never stores or asks for the safe word." },
  { icon: <ScrollText className="size-4" />, t: "Scam report", d: "One tap adds the number and an audio fingerprint — not a voiceprint — to the shared blocklist." },
];

const BIZ_FEATURES = [
  { t: "POST /v1/assess", d: "Phone number, optional audio, transaction context → risk score, reasons, recommended action." },
  { t: "OTP guard", d: "Check for a recent SIM swap before sending an SMS code — else in-app confirmation or a branch visit." },
  { t: "Cooling-off hold", d: "After a SIM swap or a new payee, large transfers hold for 30–60 minutes. Releases need two approvers." },
  { t: "Verified bank call", d: "Register outbound calls; customers see \u201CYour bank is calling you now.\u201D No banner means hang up." },
  { t: "Evidence log", d: "A hash-chained record of every decision — verifiable with open-source shield-verify." },
];

export function ProductsSection() {
  return (
    <section id="products" className="border-b border-border/70 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Two products, one engine"
          title="Free for everyone. An API for banks and telcos."
          lede="The same verdicts, the same evidence chain — one public tier funded for safety, one business tier with holds, OTP guards and webhooks."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Public */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Shield for Everyone</h3>
              <span className="rounded-full bg-verdict-clear/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-verdict-clear">
                free · public
              </span>
            </div>
            <ul className="mt-6 space-y-4">
              {PUBLIC_FEATURES.map((f) => (
                <li key={f.t} className="flex gap-3">
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">{f.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{f.t}</p>
                    <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Business */}
          <div className="flex flex-col rounded-3xl border border-console-line bg-console p-6 text-console-ink sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-console-ink">Shield for Banks &amp; Telcos</h3>
              <span className="rounded-full border border-console-line px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-verdict-caution">
                paid · api
              </span>
            </div>
            <ul className="mt-6 space-y-4">
              {BIZ_FEATURES.map((f) => (
                <li key={f.t} className="border-l-2 border-verdict-verified/50 pl-3">
                  <p className="font-mono text-[13px] font-semibold text-verdict-verified">{f.t}</p>
                  <p className="mt-0.5 text-sm leading-snug text-console-ink/75">{f.d}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex-1" />
            <pre className="nice-scroll overflow-x-auto rounded-2xl border border-console-line bg-black/35 p-4 font-mono text-[11.5px] leading-relaxed text-console-ink/85">
{`POST /v1/assess
{
  "msisdn":      "+255712345678",
  "channel":     "outbound_transfer",
  "amountMinor": 50000000,
  "currency":    "TZS"
}

→ {
  "verdict":  "caution",
  "reasons":  ["SIM_SWAP_RECENT"],
  "action":   "step_up"   // allow · step_up · hold · review
}`}
            </pre>
            <p className="mt-3 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider text-console-ink/45">
              <Wifi className="size-3.5" /> every failure mode returns step_up — never allow
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Agents                                                              */
/* ------------------------------------------------------------------ */

const AGENTS = [
  {
    icon: <MessagesSquare className="size-5" />,
    name: "Guardian",
    channel: "Phone leg merged into a live call",
    purpose: "Disclose, run the repeat-after-me challenge, leave. The result goes privately to the user — the agent never learns it.",
    budget: "6 min cap · 12 turns · 8 tool calls",
  },
  {
    icon: <Bot className="size-5" />,
    name: "Helper",
    channel: "WhatsApp & in-app chat",
    purpose: "Check numbers and voice notes, explain results, file reports, teach safety in eleven locales.",
    budget: "30 turns · idle timeout 60 s",
  },
  {
    icon: <MonitorDot className="size-5" />,
    name: "Console Copilot",
    channel: "Business console (text)",
    purpose: "Explain cases, summarise scam waves, draft policy changes — drafts only; humans approve with four eyes.",
    budget: "20 turns per thread",
  },
];

const INVARIANTS = [
  ["G-1", "Never sets or words a verdict"],
  ["G-2", "Never asks for a PIN, OTP or password"],
  ["G-3", "Numbers come from the registry only"],
  ["G-4", "Never learns the result it delivers"],
  ["G-5", "Says it is an AI, first sentence"],
  ["G-6", "Never claims certainty"],
  ["G-8", "Never calls first, never clones"],
  ["G-10", "Bounded sessions, scripted exits"],
];

export function AgentsSection() {
  return (
    <section id="agents" className="border-b border-border/70 bg-secondary/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Agents talk. They never decide."
          title="Three bounded workers on ElevenLabs Agents"
          lede="Every session gets one mission, an allow-list of tools and fixed budgets. Detection, verdicts, holds and releases come from the deterministic engine."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <article key={a.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">{a.icon}</span>
                <div>
                  <h3 className="font-bold">{a.name}</h3>
                  <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">{a.channel}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{a.purpose}</p>
              <p className="mt-4 border-t border-border/70 pt-3 font-mono text-[10.5px] uppercase tracking-wider text-primary">{a.budget}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {INVARIANTS.map(([id, label]) => (
            <span key={id} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium">
              <span className="font-mono font-bold text-primary">{id}</span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Architecture                                                        */
/* ------------------------------------------------------------------ */

export function ArchitectureSection() {
  return (
    <section id="architecture" className="border-b border-border/70 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Architecture"
          title="No model sits in a decision path"
          lede="Models produce signals; a versioned, tested rule pack turns signals into verdicts and actions."
        />
        <div className="relative mx-auto mt-12 max-w-4xl">
          <div className="space-y-0">
            <Plane
              tone="light"
              icon={<MessagesSquare className="size-4" />}
              name="Channels"
              items={["WhatsApp", "Live Call Guardian (PSTN)", "USSD", "SMS", "Mobile app", "Business API"]}
            />
            <PlaneConnector label="inbound events · server tools (scoped, signed, no verdict power)" />
            <Plane
              tone="dark"
              icon={<Bot className="size-4" />}
              name="Conversation plane — ElevenLabs Agents"
              items={["Guardian (voice)", "Helper (chat)", "Console Copilot", "KB + RAG", "Guardrails 2.0"]}
              note="speech, turn-taking, phrasing, language"
            />
            <PlaneConnector label="tool calls · validated, idempotent, session-bound" />
            <Plane
              tone="dark"
              icon={<ServerCog className="size-4" />}
              name="Control plane — Shield Core (deterministic)"
              items={["sessions & challenges", "signal fusion", "policy packs", "holds", "verified calls", "audit chain"]}
              note="pure engine · replayable · property-tested"
            />
            <PlaneConnector label="signal fetch · adapters map every error to unknown" />
            <Plane
              tone="light"
              icon={<CircuitBoard className="size-4" />}
              name="Signal plane"
              items={["D1 ElevenLabs classifier", "D2 vendor detector", "D3 in-house", "CAMARA SIM swap", "number reputation", "scam-script cues"]}
            />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Fail toward verification", "Missing, late or contradictory evidence gives Inconclusive (public) or step_up (business). Never Clear."],
              ["Everything is audited", "Each decision commits with a hash-chained evidence entry in the same transaction."],
              ["Degrades loudly", "Operating modes show in the console, the API header and the public banner."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-bold">{t}</p>
                <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Plane({
  name,
  items,
  icon,
  tone,
  note,
}: {
  name: string;
  items: string[];
  icon: React.ReactNode;
  tone: "light" | "dark";
  note?: string;
}) {
  const dark = tone === "dark";
  return (
    <div
      className={`rounded-2xl border p-5 ${
        dark ? "border-console-line bg-console text-console-ink" : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] ${dark ? "text-console-ink" : "text-foreground"}`}>
          <span className={dark ? "text-verdict-verified" : "text-primary"}>{icon}</span>
          {name}
        </p>
        {note && (
          <p className={`font-mono text-[10px] uppercase tracking-wider ${dark ? "text-console-ink/45" : "text-muted-foreground"}`}>{note}</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11.5px] ${
              dark ? "border-console-line bg-white/[0.04] text-console-ink/85" : "border-border bg-secondary/70 text-foreground/80"
            }`}
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlaneConnector({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-1.5" aria-hidden>
      <ArrowDown className="size-4 text-primary/60" />
      <span className="mt-0.5 max-w-md text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ — written answer-first for answer engines (AEO)                 */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "Is this call from my bank real?",
    a: "Ask Shield. If the bank registered the call, your app shows \u201CYour bank is calling you now\u201D. If nothing shows, hang up and call the number on your card. Spoofed caller ID cannot fake a registry entry.",
  },
  {
    q: "Can a cloned voice pass the check?",
    a: "It gets harder every step. The voice is scored by at least two independent detectors; a live caller must repeat random words in real time; the number is checked for SIM swaps; and the story is scored for scam pressure. No single test decides, and \u201Cno warning signs found\u201D is never a guarantee.",
  },
  {
    q: "Does Shield keep my audio?",
    a: "No. Public audio is scored in memory and deleted within 60 seconds. Shield stores an acoustic fingerprint — never a voiceprint of a person — and transcripts are redacted before storage.",
  },
  {
    q: "What does \u201CNo warning signs found\u201D mean?",
    a: "It means every check Shield could run came back clean. It is deliberately not \u201Cdefinitely real\u201D. The advice stays the same: never share your PIN or any code, and confirm big requests through a second channel.",
  },
  {
    q: "What if my relative really is in trouble?",
    a: "Shield never accuses. A Caution or Danger tells you how to verify — call them back on a number you saved before — and real banks don\u2019t mind you checking. If a check is wrong, the number\u2019s owner can appeal and gets a decision within 72 hours.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="border-b border-border/70 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Learn — five ways to spot a cloned voice"
          title="Questions people actually ask"
          lede="Plain-language answers, written answer-first in every launch language, reviewed by native speakers."
        />
        <Accordion type="single" collapsible className="mt-10">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-bold hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer (sticky via mt-auto on the page wrapper)                     */
/* ------------------------------------------------------------------ */

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-console text-console-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-verdict-verified text-white">
              <ShieldCheck className="size-5" />
            </span>
            <p className="text-sm font-bold">SecureVoice Shield</p>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-console-ink/65">
            A sister product to SecureVoice AI — the bank calls the customer to stop fraud; Shield
            protects everyone when someone else pretends to be either of them.
          </p>
          <p className="mt-4 rounded-xl border border-verdict-caution/40 bg-verdict-caution/10 p-3 text-[13px] leading-snug text-verdict-caution">
            <b>Demo build.</b> Sandbox data only, scripted telco answers, no real calls. Shield
            never says a voice is definitely real.
          </p>
        </div>

        <nav aria-label="Explore">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-console-ink/45">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ["#demo", "Live sandbox"],
              ["#signals", "How detection works"],
              ["#verdicts", "The five verdicts"],
              ["#products", "Products & API"],
              ["#audit", "Audit chain"],
              ["#faq", "Learn"],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="text-console-ink/75 transition-colors hover:text-verdict-verified">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Markets">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-console-ink/45">Launch markets</p>
          <ul className="mt-3 space-y-2 text-sm text-console-ink/75">
            <li>UAE · Arabic, English, Hindi, Urdu</li>
            <li>Kenya · Kiswahili, English</li>
            <li>Uganda · Luganda, English, Kiswahili</li>
            <li>Tanzania · Kiswahili, English</li>
          </ul>
          <p className="mt-4 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-console-ink/45">
            <Globe2 className="size-3.5" /> data stays in-country
          </p>
        </nav>

        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-console-ink/45">Companion docs</p>
          <p className="mt-3 text-sm leading-relaxed text-console-ink/65">
            This page implements the Shield spec: 01 Design System (KANGA) · 02 Platform &amp; API
            Behaviour · 03 Agents &amp; Guardrails · 05 Edge Cases &amp; Operating Modes · 13
            Compliance &amp; Audit · 14 Discoverability.
          </p>
          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-wider text-console-ink/40">
            Golden rule: Shield never calls you first.
          </p>
        </div>
      </div>
      <div className="border-t border-console-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-console-ink/40 sm:px-6">
          <span>© 2026 SecureVoice · demo environment</span>
          <span>verdicts are advice, not certainty</span>
        </div>
      </div>
    </footer>
  );
}

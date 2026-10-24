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
import { LocaleSwitcher } from "@/components/shield/locale-switcher";
import { FaqJsonLd } from "./structured-data";
import { CopyText } from "./copy-text";
import type { Copy, Dictionary } from "@/lib/i18n";

/* ------------------------------------------------------------------ */
/* Stats strip                                                         */
/* ------------------------------------------------------------------ */

export function StatsStrip({ d }: { d: Dictionary }) {
  return (
    <section aria-label={d.stats.ariaLabel.text} className="border-b border-border/70 bg-card/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {d.stats.items.map((s) => (
          <div key={s.v.text} className="border-l-2 border-primary/30 pl-4">
            <p className="text-3xl font-extrabold tracking-tight">
              <CopyText copy={s.v} review={d.review} />
            </p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              <CopyText copy={s.l} review={d.review} />
            </p>
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
  headingId,
  review,
}: {
  eyebrow: Copy;
  title: Copy;
  lede?: Copy;
  headingId?: string;
  review: Dictionary["review"];
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        <CopyText copy={eyebrow} review={review} />
      </p>
      <h2 id={headingId} className="mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
        <CopyText copy={title} review={review} />
      </h2>
      {lede && (
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          <CopyText copy={lede} review={review} />
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The four signals                                                    */
/* ------------------------------------------------------------------ */

export function SignalsSection({ d }: { d: Dictionary }) {
  const ICONS = [AudioWaveform, MessageSquareWarning, CardSim, BookOpenText];
  return (
    <section id="signals" className="border-b border-border/70 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow={d.signals.eyebrow}
          title={d.signals.title}
          lede={d.signals.lede}
          review={d.review}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {d.signals.items.map((s, i) => {
            const Icon = ICONS[i];
            return (
              <article
                key={s.id.text}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_16px_40px_-24px_rgba(18,83,63,0.4)]"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-secondary text-primary">
                    {Icon ? <Icon className="size-5" /> : null}
                  </span>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
                    <CopyText copy={s.id} review={d.review} />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold">
                  <CopyText copy={s.title} review={d.review} />
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  <CopyText copy={s.body} review={d.review} />
                </p>
              </article>
            );
          })}
        </div>
        <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-primary/25 bg-secondary/60 p-5">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <p className="text-sm leading-relaxed text-foreground/90">
            <b>
              <CopyText copy={d.signals.floor.label} review={d.review} />
            </b>{" "}
            <CopyText copy={d.signals.floor.body} review={d.review} />
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Verdict gallery                                                     */
/* ------------------------------------------------------------------ */

export function VerdictsSection({ d }: { d: Dictionary }) {
  return (
    <section id="verdicts" className="border-b border-border/70 bg-secondary/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow={d.verdicts.eyebrow}
          title={d.verdicts.title}
          lede={d.verdicts.lede}
          review={d.review}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {d.verdicts.items.map((v) => (
            <article key={v.key} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
              <VerdictGlyph verdict={v.key} size={56} />
              <h3 className="mt-4 text-lg font-bold">
                <CopyText copy={v.name} review={d.review} />
              </h3>
              <p className="mt-1 text-sm font-semibold text-foreground/85">
                <CopyText copy={v.wording} review={d.review} />
              </p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                <CopyText copy={v.advice} review={d.review} />
              </p>
              <p className="mt-4 border-t border-border/70 pt-3 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                {v.shape.text} · {v.color.text} ·{" "}
                {v.pulses === 0
                  ? d.verdicts.pulseMany.text
                  : `${v.pulses} ${v.pulses === 1 ? d.verdicts.pulseOne.text : d.verdicts.pulseMany.text}`}
              </p>
            </article>
          ))}
          <article className="flex flex-col justify-center rounded-2xl border border-dashed border-primary/40 bg-primary/[0.04] p-6">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-primary">
              <CopyText copy={d.verdicts.goldenRuleLabel} review={d.review} />
            </p>
            <p className="mt-2 text-xl font-bold leading-snug">
              <CopyText copy={d.verdicts.goldenRuleLine} review={d.review} />
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <CopyText copy={d.verdicts.goldenRuleBody} review={d.review} />
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

const PUBLIC_ICONS = [MessagesSquare, Timer, KeyRound, Radio, Lock, ScrollText];

export function ProductsSection({ d }: { d: Dictionary }) {
  return (
    <section id="products" className="border-b border-border/70 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow={d.products.eyebrow}
          title={d.products.title}
          lede={d.products.lede}
          review={d.review}
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* Public */}
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">
                <CopyText copy={d.products.publicName} review={d.review} />
              </h3>
              <span className="rounded-full bg-verdict-clear/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-verdict-clear">
                <CopyText copy={d.products.publicBadge} review={d.review} />
              </span>
            </div>
            <ul className="mt-6 space-y-4">
              {d.products.publicFeatures.map((f, i) => {
                const Icon = PUBLIC_ICONS[i];
                return (
                  <li key={f.t.text} className="flex gap-3">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                      {Icon ? <Icon className="size-4" /> : null}
                    </span>
                    <div>
                      <p className="text-sm font-bold">
                        <CopyText copy={f.t} review={d.review} />
                      </p>
                      <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                        <CopyText copy={f.d} review={d.review} />
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Business */}
          <div className="flex flex-col rounded-3xl border border-console-line bg-console p-6 text-console-ink sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-console-ink">
                <CopyText copy={d.products.businessName} review={d.review} />
              </h3>
              <span className="rounded-full border border-console-line px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-verdict-caution">
                <CopyText copy={d.products.businessBadge} review={d.review} />
              </span>
            </div>
            <ul className="mt-6 space-y-4">
              {d.products.businessFeatures.map((f) => (
                <li key={f.t.text} className="border-l-2 border-verdict-verified/50 pl-3">
                  <p className="font-mono text-[13px] font-semibold text-verdict-verified">
                    <CopyText copy={f.t} review={d.review} />
                  </p>
                  <p className="mt-0.5 text-sm leading-snug text-console-ink/75">
                    <CopyText copy={f.d} review={d.review} />
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex-1" />
            <pre className="nice-scroll overflow-x-auto rounded-2xl border border-console-line bg-black/35 p-4 font-mono text-[11.5px] leading-relaxed text-console-ink/85">
{`POST /v1/assess
{
  "msisdn":      "+255 7XX XXX X12",
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
              <Wifi className="size-3.5" /> <CopyText copy={d.products.failSafe} review={d.review} />
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-console-ink/55">
              <CopyText copy={d.products.apiNote} review={d.review} />
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

const AGENT_ICONS = [MessagesSquare, Bot, MonitorDot];

export function AgentsSection({ d }: { d: Dictionary }) {
  return (
    <section id="agents" className="border-b border-border/70 bg-secondary/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow={d.agents.eyebrow}
          title={d.agents.title}
          lede={d.agents.lede}
          review={d.review}
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {d.agents.items.map((a, i) => {
            const Icon = AGENT_ICONS[i];
            return (
              <article key={a.name.text} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                    {Icon ? <Icon className="size-5" /> : null}
                  </span>
                  <div>
                    <h3 className="font-bold">
                      <CopyText copy={a.name} review={d.review} />
                    </h3>
                    <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                      <CopyText copy={a.channel} review={d.review} />
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  <CopyText copy={a.purpose} review={d.review} />
                </p>
                <p className="mt-4 border-t border-border/70 pt-3 font-mono text-[10.5px] uppercase tracking-wider text-primary">
                  <CopyText copy={a.budget} review={d.review} />
                </p>
              </article>
            );
          })}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {d.agents.invariants.map((inv) => (
            <span key={inv.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium">
              <span className="font-mono font-bold text-primary">{inv.id}</span>
              <CopyText copy={inv.label} review={d.review} />
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

export function ArchitectureSection({ d }: { d: Dictionary }) {
  const PLANE_ICONS = [MessagesSquare, Bot, ServerCog, CircuitBoard];
  return (
    <section id="architecture" className="border-b border-border/70 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow={d.architecture.eyebrow}
          title={d.architecture.title}
          lede={d.architecture.lede}
          review={d.review}
        />
        <div className="relative mx-auto mt-12 max-w-4xl">
          <div className="space-y-0">
            {d.architecture.planes.map((plane, i) => {
              const PlaneIcon = PLANE_ICONS[i];
              return (
                <div key={plane.name.text}>
                  <Plane
                    tone={i === 1 || i === 2 ? "dark" : "light"}
                    icon={PlaneIcon ? <PlaneIcon className="size-4" /> : null}
                    name={plane.name}
                    items={plane.items}
                    note={plane.note}
                    review={d.review}
                  />
                  {d.architecture.connectors[i] ? (
                    <PlaneConnector label={d.architecture.connectors[i]} review={d.review} />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {d.architecture.cards.map((c) => (
              <div key={c.t.text} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-bold">
                  <CopyText copy={c.t} review={d.review} />
                </p>
                <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                  <CopyText copy={c.d} review={d.review} />
                </p>
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
  review,
}: {
  name: Copy;
  items: Copy[];
  icon: React.ReactNode;
  tone: "light" | "dark";
  note?: Copy;
  review: Dictionary["review"];
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
          <CopyText copy={name} review={review} />
        </p>
        {note && (
          <p className={`font-mono text-[10px] uppercase tracking-wider ${dark ? "text-console-ink/45" : "text-muted-foreground"}`}>
            <CopyText copy={note} review={review} />
          </p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i.text}
            className={`rounded-lg border px-2.5 py-1 font-mono text-[11.5px] ${
              dark ? "border-console-line bg-white/[0.04] text-console-ink/85" : "border-border bg-secondary/70 text-foreground/80"
            }`}
          >
            <CopyText copy={i} review={review} />
          </span>
        ))}
      </div>
    </div>
  );
}

function PlaneConnector({ label, review }: { label: Copy; review: Dictionary["review"] }) {
  return (
    <div className="flex flex-col items-center py-1.5" aria-hidden>
      <ArrowDown className="size-4 text-primary/60" />
      <span className="mt-0.5 max-w-md text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <CopyText copy={label} review={review} />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ — written answer-first for answer engines (AEO)                 */
/* ------------------------------------------------------------------ */

/**
 * The questions the page answers, straight from the dictionary, so the
 * accordion and the FAQPage structured data (14, section 6) can never
 * drift apart.
 */
export function faqItems(d: Dictionary): { q: string; a: string }[] {
  return d.faq.items.map((item) => ({ q: item.q.text, a: item.a.text }));
}

export function FaqSection({ d }: { d: Dictionary }) {
  return (
    <section id="faq" className="border-b border-border/70 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead
          eyebrow={d.faq.eyebrow}
          title={d.faq.title}
          lede={d.faq.lede}
          review={d.review}
        />
        <Accordion type="single" collapsible className="mt-10">
          {d.faq.items.map((f, i) => (
            <AccordionItem key={f.q.text} value={`q${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-bold hover:no-underline">
                <CopyText copy={f.q} review={d.review} />
              </AccordionTrigger>
              <AccordionContent className="text-[15px] leading-relaxed text-muted-foreground">
                <CopyText copy={f.a} review={d.review} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <FaqJsonLd items={faqItems(d)} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Footer (sticky via mt-auto on the page wrapper)                     */
/* ------------------------------------------------------------------ */

export function SiteFooter({ d }: { d: Dictionary }) {
  return (
    <footer className="mt-auto bg-console text-console-ink">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-4">
        <LocaleSwitcher current={d.locale} />
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-verdict-verified text-white">
              <ShieldCheck className="size-5" />
            </span>
            <p className="text-sm font-bold">SecureVoice Shield</p>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-console-ink/65">
            <CopyText copy={d.footer.about} review={d.review} />
          </p>
          <p className="mt-4 rounded-xl border border-verdict-caution/40 bg-verdict-caution/10 p-3 text-[13px] leading-snug text-verdict-caution">
            <b>Demo build.</b> <CopyText copy={d.footer.demoNote} review={d.review} />
          </p>
        </div>

        <nav aria-label={d.footer.exploreLabel.text} className="text-console-ink/75">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-console-ink/45">
            <CopyText copy={d.footer.exploreLabel} review={d.review} />
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {d.footer.explore.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="text-console-ink/75 transition-colors hover:text-verdict-verified">
                  <CopyText copy={link.label} review={d.review} />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={d.footer.marketsLabel.text} className="text-console-ink/75">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-console-ink/45">
            <CopyText copy={d.footer.marketsLabel} review={d.review} />
          </p>
          <ul className="mt-3 space-y-2 text-sm text-console-ink/75">
            {d.footer.markets.map((market) => (
              <li key={market.text}>
                <CopyText copy={market} review={d.review} />
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-console-ink/45">
            <Globe2 className="size-3.5" /> <CopyText copy={d.footer.dataInCountry} review={d.review} />
          </p>
        </nav>

        <div>
          <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-console-ink/45">
            <CopyText copy={d.footer.docsLabel} review={d.review} />
          </p>
          <p className="mt-3 text-sm leading-relaxed text-console-ink/65">
            <CopyText copy={d.footer.docs} review={d.review} />
          </p>
          <p className="mt-4 font-mono text-[10.5px] uppercase tracking-wider text-console-ink/40">
            <CopyText copy={d.footer.goldenRule} review={d.review} />
          </p>
        </div>
      </div>
      <div className="safe-bottom border-t border-console-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[10.5px] uppercase tracking-[0.16em] text-console-ink/40 sm:px-6">
          <span>{d.footer.copyright.text}</span>
          <span>{d.footer.disclaimer.text}</span>
        </div>
      </div>
    </footer>
  );
}

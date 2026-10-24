import { GoldenRuleBar, SiteHeader } from "@/components/shield/site-chrome";
import { Hero } from "@/components/shield/hero";
import { DemoConsole } from "@/components/shield/demo/demo-console";
import { AuditPanel } from "@/components/shield/audit-panel";
import { MarketsSection } from "@/components/shield/markets-section";
import { Reveal } from "@/components/shield/reveal";
import { CopyText } from "@/components/shield/copy-text";
import {
  AgentsSection,
  ArchitectureSection,
  FaqSection,
  ProductsSection,
  SectionHead,
  SignalsSection,
  SiteFooter,
  StatsStrip,
  VerdictsSection,
} from "@/components/shield/sections";
import { localeEntry, type Dictionary } from "@/lib/i18n";

/**
 * The page body, shared by every locale route (14, section 2).
 *
 * The root path `/` is the market and language picker; the eleven locale
 * paths render this body with their own dictionary, their own direction
 * and their own market line. One component, so the pages can never drift
 * apart.
 */
export function ShieldPage({ d }: { d: Dictionary }) {
  const entry = localeEntry(d.locale);
  const pendingReview = entry.review.state === "pendingNativeReview";
  const isEnglish = d.locale.startsWith("en-");

  return (
    <div className="flex min-h-screen flex-col" lang={d.locale} dir={d.dir}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
      >
        <CopyText copy={d.nav.skipToContent} review={d.review} />
      </a>
      <GoldenRuleBar d={d} />
      <SiteHeader d={d} />

      {pendingReview ? <ReviewBadge d={d} /> : null}

      <div className="border-b border-border/70 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm leading-snug sm:px-6">
          <span className="font-semibold text-foreground">
            <CopyText copy={d.local.marketName} review={d.review} />
          </span>
          <span className="text-muted-foreground"> · </span>
          <span className="text-muted-foreground">
            <CopyText copy={d.local.marketNote} review={d.review} />
          </span>
        </div>
      </div>

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Hero d={d} />
        <StatsStrip d={d} />

        {/* ------------------------------ Sandbox ------------------------------ */}
        <section id="demo" className="border-b border-border/70 py-20 sm:py-24" aria-labelledby="demo-heading">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal>
              <SectionHead
                eyebrow={d.sandbox.eyebrow}
                title={d.sandbox.title}
                lede={d.sandbox.lede}
                headingId="demo-heading"
                review={d.review}
              />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-10">
                <DemoConsole
                  tabs={{
                    number: d.sandbox.tabs.number.text,
                    voice: d.sandbox.tabs.voice.text,
                    guardian: d.sandbox.tabs.guardian.text,
                    verified: d.sandbox.tabs.verified.text,
                  }}
                />
              </div>
              <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                <CopyText copy={d.sandbox.caption} review={d.review} />
              </p>
              {isEnglish ? null : (
                <p className="mt-2 text-center text-[13px] text-muted-foreground">
                  <CopyText copy={d.sandbox.consoleNote} review={d.review} />
                </p>
              )}
            </Reveal>
          </div>
        </section>

        <VerdictsSection d={d} />
        <SignalsSection d={d} />
        <ProductsSection d={d} />
        <MarketsSection d={d} highlight={entry.market} />
        <AgentsSection d={d} />
        <ArchitectureSection d={d} />

        {/* ------------------------------ Audit chain ------------------------------ */}
        <section id="audit" className="border-b border-border/70 py-20 sm:py-24" aria-labelledby="audit-heading">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal>
              <SectionHead
                eyebrow={d.audit.eyebrow}
                title={d.audit.title}
                lede={d.audit.lede}
                headingId="audit-heading"
                review={d.review}
              />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-10">
                <AuditPanel />
              </div>
              {isEnglish ? null : (
                <p className="mt-4 text-center text-[13px] text-muted-foreground">
                  <CopyText copy={d.audit.consoleNote} review={d.review} />
                </p>
              )}
            </Reveal>
          </div>
        </section>

        <FaqSection d={d} />
      </main>

      <SiteFooter d={d} />
    </div>
  );
}

/**
 * The honest badge: this locale's copy has not been through native-speaker
 * review yet. Language QA is a market go-live gate (14, section 12), so the
 * page says so rather than pretending otherwise.
 */
function ReviewBadge({ d }: { d: Dictionary }) {
  return (
    <div className="border-b border-verdict-caution/30 bg-verdict-caution/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-[13px] leading-snug sm:px-6">
        <span className="inline-flex items-center rounded-full border border-verdict-caution/50 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-verdict-caution">
          <CopyText copy={d.review.badge} review={d.review} />
        </span>
        <span className="text-muted-foreground">
          <CopyText copy={d.review.badgeDetail} review={d.review} />
        </span>
      </div>
    </div>
  );
}

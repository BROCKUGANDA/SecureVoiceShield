import { GoldenRuleBar, SiteHeader } from "@/components/shield/site-chrome";
import { Hero } from "@/components/shield/hero";
import { DemoConsole } from "@/components/shield/demo/demo-console";
import { AuditPanel } from "@/components/shield/audit-panel";
import { MarketsSection } from "@/components/shield/markets-section";
import { Reveal } from "@/components/shield/reveal";
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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
      >
        Skip to content
      </a>
      <GoldenRuleBar />
      <SiteHeader />

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Hero />
        <StatsStrip />

        {/* ------------------------------ Sandbox ------------------------------ */}
        <section id="demo" className="border-b border-border/70 py-20 sm:py-24" aria-labelledby="demo-heading">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal>
              <SectionHead
                eyebrow="Live sandbox"
                title="Run the checks yourself"
                lede="A working slice of Shield: the deterministic engine, the verdict cards, the private Guardian flow and the hash-chained evidence log — wired to scripted sandbox answers."
                headingId="demo-heading"
              />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-10">
                <DemoConsole />
              </div>
              <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                sandbox · synthetic data · scripted telco answers · nothing here makes a real call
              </p>
            </Reveal>
          </div>
        </section>

        <VerdictsSection />
        <SignalsSection />
        <ProductsSection />
        <MarketsSection />
        <AgentsSection />
        <ArchitectureSection />

        {/* ------------------------------ Audit chain ------------------------------ */}
        <section id="audit" className="border-b border-border/70 py-20 sm:py-24" aria-labelledby="audit-heading">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal>
              <SectionHead
                eyebrow="Compliance"
                title="Anyone can verify every decision"
                lede="A live view of the evidence chain this page is writing to. Every check you ran above is in here — recomputed and re-verified on demand."
                headingId="audit-heading"
              />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mt-10">
                <AuditPanel />
              </div>
            </Reveal>
          </div>
        </section>

        <FaqSection />
      </main>

      <SiteFooter />
    </div>
  );
}

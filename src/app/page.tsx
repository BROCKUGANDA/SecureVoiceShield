import { GoldenRuleBar, SiteHeader } from "@/components/shield/site-chrome";
import { Hero } from "@/components/shield/hero";
import { DemoConsole } from "@/components/shield/demo/demo-console";
import { AuditPanel } from "@/components/shield/audit-panel";
import { MarketsSection } from "@/components/shield/markets-section";
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
      <GoldenRuleBar />
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <StatsStrip />

        {/* ------------------------------ Sandbox ------------------------------ */}
        <section id="demo" className="border-b border-border/70 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHead
              eyebrow="Live sandbox"
              title="Run the checks yourself"
              lede="A working slice of Shield: the deterministic engine, the verdict cards, the private Guardian flow and the hash-chained evidence log — wired to scripted sandbox answers."
            />
            <div className="mt-10">
              <DemoConsole />
            </div>
            <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              sandbox · synthetic data · scripted telco answers · nothing here makes a real call
            </p>
          </div>
        </section>

        <VerdictsSection />
        <SignalsSection />
        <ProductsSection />
        <MarketsSection />
        <AgentsSection />
        <ArchitectureSection />

        {/* ------------------------------ Audit chain ------------------------------ */}
        <section id="audit" className="border-b border-border/70 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <SectionHead
              eyebrow="Compliance"
              title="Anyone can verify every decision"
              lede="A live view of the evidence chain this page is writing to. Every check you ran above is in here — recomputed and re-verified on demand."
            />
            <div className="mt-10">
              <AuditPanel />
            </div>
          </div>
        </section>

        <FaqSection />
      </main>

      <SiteFooter />
    </div>
  );
}

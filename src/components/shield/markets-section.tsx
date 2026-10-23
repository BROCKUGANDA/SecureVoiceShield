import { Landmark, Smartphone, Radio, MessageCircle, Banknote, Languages } from "lucide-react";
import { MarketClocks } from "./market-clocks";
import { SectionHead } from "./sections";

const MARKETS = [
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "AE",
    languages: ["Arabic", "English", "Hindi", "Urdu"],
    channels: ["App", "WhatsApp", "SMS"],
    rails: "Cards, bank transfers, wallets",
    pattern: "Fake police or visa officers threatening expats; \u201Csafe account\u201D fraud-team calls.",
    accent: "from-emerald-50",
  },
  {
    code: "KE",
    name: "Kenya",
    languages: ["Kiswahili", "English", "Sheng-aware"],
    channels: ["WhatsApp", "USSD", "SMS", "App"],
    rails: "M-PESA, Airtel Money, PesaLink",
    pattern: "\u201CMoney sent by mistake\u201D reversal calls; fake customer care asking for your PIN.",
    accent: "from-lime-50",
  },
  {
    code: "UG",
    name: "Uganda",
    languages: ["Luganda", "English", "Kiswahili"],
    channels: ["USSD", "SMS", "WhatsApp", "App"],
    rails: "MTN MoMo, Airtel Money, banks",
    pattern: "Cloned-relative emergencies on voice notes; MTN MoMo \u201Cupgrade\u201D PIN harvesting.",
    accent: "from-amber-50",
  },
  {
    code: "TZ",
    name: "Tanzania",
    languages: ["Kiswahili", "English"],
    channels: ["USSD", "SMS", "WhatsApp", "App"],
    rails: "M-Pesa, Mixx by Yas, HaloPesa",
    pattern: "\u201CIle pesa tuma kwa namba hii\u201D continuation scams. Report to TCRA on 15040.",
    accent: "from-teal-50",
  },
];

export function MarketsSection() {
  return (
    <section id="markets" className="border-b border-border/70 bg-secondary/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow="Markets"
          title="Uganda is first-class, Tanzania is Kiswahili-first"
          lede="Four launch markets, eleven locales, different phones and money rails — one cautious verdict everywhere. Data is stored and processed in-country."
        />

        <div className="mt-8 flex justify-center">
          <MarketClocks />
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {MARKETS.map((m) => (
            <article key={m.code} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgba(18,83,63,0.35)]">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary font-mono text-sm font-bold tracking-wider text-primary-foreground">
                  {m.code}
                </span>
                <Languages className="size-4 text-muted-foreground" aria-hidden />
              </div>
              <h3 className="mt-4 font-bold">{m.name}</h3>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.languages.map((l) => (
                  <span key={l} className="rounded-md bg-secondary px-2 py-0.5 text-[11.5px] font-semibold text-primary">
                    {l}
                  </span>
                ))}
              </div>

              <ul className="mt-4 space-y-2 text-[13px] text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Radio className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                  {m.channels.join(" · ")}
                </li>
                <li className="flex items-start gap-2">
                  <Banknote className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                  {m.rails}
                </li>
                <li className="flex items-start gap-2">
                  <Smartphone className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                  USSD zero-rated where possible — checks cost the user nothing
                </li>
              </ul>

              <p className="mt-4 flex-1 border-t border-border/70 pt-3 text-[13px] leading-snug text-muted-foreground">
                <span className="flex items-center gap-1.5 font-semibold text-foreground/85">
                  <Landmark className="size-3.5 text-verdict-caution" /> Pattern to watch
                </span>
                <span className="mt-1 block">{m.pattern}</span>
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 text-center text-sm leading-relaxed text-muted-foreground">
          <MessageCircle className="mr-1.5 inline size-4 text-primary" />
          Awareness campaigns repeat two lines in every language on local radio:{" "}
          <b className="text-foreground">&ldquo;Shield never calls you first&rdquo;</b> and the USSD
          code. Tanzania pilots also teach TCRA&rsquo;s <span className="font-mono">15040</span> and{" "}
          <span className="font-mono">*106#</span> self-check for SIMs registered to your ID.
        </p>
      </div>
    </section>
  );
}

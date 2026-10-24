import { Landmark, Smartphone, Radio, MessageCircle, Banknote, Languages } from "lucide-react";
import { MarketClocks } from "./market-clocks";
import { SectionHead } from "./sections";
import { CopyText } from "./copy-text";
import type { Dictionary } from "@/lib/i18n";

export function MarketsSection({
  d,
  highlight,
}: {
  d: Dictionary;
  /** The market code of the page this section is rendered on. */
  highlight?: string;
}) {
  return (
    <section id="markets" className="border-b border-border/70 bg-secondary/40 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHead
          eyebrow={d.markets.eyebrow}
          title={d.markets.title}
          lede={d.markets.lede}
          review={d.review}
        />

        <div className="mt-8 flex justify-center">
          <MarketClocks />
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {d.markets.items.map((m) => {
            const isLocal = highlight === m.code;
            return (
              <article
                key={m.code}
                className={`flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-24px_rgba(18,83,63,0.35)] ${
                  isLocal ? "border-primary/60 ring-1 ring-primary/30" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary font-mono text-sm font-bold tracking-wider text-primary-foreground">
                    {m.code}
                  </span>
                  {isLocal ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                      <CopyText copy={d.markets.yourMarket} review={d.review} />
                    </span>
                  ) : (
                    <Languages className="size-4 text-muted-foreground" aria-hidden />
                  )}
                </div>
                <h3 className="mt-4 font-bold">
                  <CopyText copy={m.name} review={d.review} />
                </h3>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.languages.map((l) => (
                    <span key={l.text} className="rounded-md bg-secondary px-2 py-0.5 text-[11.5px] font-semibold text-primary">
                      <CopyText copy={l} review={d.review} />
                    </span>
                  ))}
                </div>

                <ul className="mt-4 space-y-2 text-[13px] text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Radio className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                    {m.channels.map((c) => c.text).join(" · ")}
                  </li>
                  <li className="flex items-start gap-2">
                    <Banknote className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                    <CopyText copy={m.rails} review={d.review} />
                  </li>
                  <li className="flex items-start gap-2">
                    <Smartphone className="mt-0.5 size-3.5 shrink-0 text-primary/70" />
                    <CopyText copy={d.markets.zeroRated} review={d.review} />
                  </li>
                </ul>

                <p className="mt-4 flex-1 border-t border-border/70 pt-3 text-[13px] leading-snug text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground/85">
                    <Landmark className="size-3.5 text-verdict-caution" />
                    <CopyText copy={d.markets.patternLabel} review={d.review} />
                  </span>
                  <span className="mt-1 block">
                    <CopyText copy={m.pattern} review={d.review} />
                  </span>
                </p>
              </article>
            );
          })}
        </div>

        <p className="mt-8 mx-auto max-w-3xl rounded-2xl border border-border bg-card p-5 text-center text-sm leading-relaxed text-muted-foreground">
          <MessageCircle className="mr-1.5 inline size-4 text-primary" />
          <CopyText copy={d.markets.awareness} review={d.review} />
        </p>
      </div>
    </section>
  );
}

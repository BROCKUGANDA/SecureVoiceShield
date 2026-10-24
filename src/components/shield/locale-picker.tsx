import Link from "next/link";
import { Globe2, ShieldCheck, ArrowRight } from "lucide-react";
import { LOCALES, type LocaleEntry } from "@/lib/i18n";
import { GOLDEN_RULE, MARKETS } from "@/lib/site";

const MARKET_NAMES: Record<string, string> = {
  AE: "United Arab Emirates",
  KE: "Kenya",
  UG: "Uganda",
  TZ: "Tanzania",
};

const MARKET_LANGUAGES: Record<string, string> = {
  AE: "Arabic, English, Hindi and Urdu",
  KE: "Kiswahili and English",
  UG: "Luganda, English and Kiswahili",
  TZ: "Kiswahili and English",
};

/**
 * The root path is a market and language picker (14, section 2).
 *
 * It is not a dead end and it is not a redirect: the golden rule stays on
 * it, every locale is one click away, and each locale page carries the
 * content that used to live at "/". No one is redirected by IP or browser
 * language — crawlers mostly come from abroad, and people travel.
 */
export function LocalePicker() {
  const groups = MARKETS.map((market) => ({
    market,
    locales: LOCALES.filter((entry) => entry.market === market),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          <Globe2 className="size-3.5" /> eleven locales · four markets
        </p>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Choose your market and language
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Shield answers in eleven locales. Each page carries its own market contacts, its own
          examples and its own canonical URL — so a Kiswahili page for Kenya is not a copy of the
          Kiswahili page for Tanzania. Pick yours below.
        </p>
        <p className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl border border-primary/25 bg-secondary/60 p-5 text-left text-sm leading-relaxed">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>
            <b>Golden rule:</b> {GOLDEN_RULE}
          </span>
        </p>
        <p className="mt-4 text-[13px] text-muted-foreground">
          Nothing is redirected by IP address or browser language. Pages whose copy has not yet had
          native-speaker review say so at the top of the page.
        </p>
      </div>

      <div className="mt-12 space-y-10">
        {groups.map((group) => (
          <section key={group.market} aria-labelledby={`market-${group.market}`}>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`market-${group.market}`} className="text-xl font-bold">
                {MARKET_NAMES[group.market]}
              </h2>
              <p className="text-sm text-muted-foreground">{MARKET_LANGUAGES[group.market]}</p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {group.locales.map((entry) => (
                <LocaleCard key={entry.code} entry={entry} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function LocaleCard({ entry }: { entry: LocaleEntry }) {
  const reviewed = entry.review.state === "reviewed";
  return (
    <Link
      href={entry.path}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_rgba(18,83,63,0.4)]"
      lang={entry.code}
      dir={entry.dir}
    >
      <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
        {entry.code}
      </span>
      <span className="mt-2 text-xl font-bold leading-tight" lang={entry.language}>
        {entry.endonym}
      </span>
      <span className="mt-1 text-sm text-muted-foreground">{entry.languageName}</span>
      <span
        className={`mt-4 inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
          reviewed
            ? "border border-verdict-verified/40 bg-verdict-verified/10 text-verdict-verified"
            : "border border-verdict-caution/50 bg-verdict-caution/10 text-verdict-caution"
        }`}
      >
        {reviewed ? "Reviewed" : "Pending native review"}
      </span>
      <span className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-primary">
        Open
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

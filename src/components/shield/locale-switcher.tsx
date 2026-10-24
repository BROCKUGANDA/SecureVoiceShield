import Link from "next/link";
import { Globe2 } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n";

/**
 * A compact language switcher for the locale pages (14, section 2).
 *
 * Every locale page offers the other locales in the reader's own market
 * first, and the rest after it. It is a real set of links, not a drop-down:
 * a crawler and a reader both see the same destinations.
 */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const entry = LOCALES.find((l) => l.code === current);
  const market = entry?.market;
  const sameMarket = LOCALES.filter((l) => l.code !== current && l.market === market);
  const others = LOCALES.filter((l) => l.code !== current && l.market !== market);

  return (
    <nav aria-label="Other languages" className="mt-6 border-t border-border/70 pt-5">
      <p className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">
        <Globe2 className="size-3.5" />
        Other languages
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
        {[...sameMarket, ...others].map((locale) => (
          <li key={locale.code}>
            <Link
              href={locale.path}
              className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              lang={locale.code}
              dir={locale.dir}
              hrefLang={locale.code}
            >
              {locale.endonym}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

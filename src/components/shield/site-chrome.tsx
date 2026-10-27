import Link from "next/link";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { ModePill } from "./mode-pill";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";
import { CopyText } from "./copy-text";
import type { Dictionary } from "@/lib/i18n";

/** The golden rule is a product surface, not a slogan (01, 12). */
export function GoldenRuleBar({ d }: { d: Dictionary }) {
  const strip = (
    <div className="flex shrink-0 items-center" aria-hidden>
      {d.goldenRule.items.map((t) => (
        <span key={t.text} className="flex items-center gap-6 pr-6 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground/85">
          <CopyText copy={t} review={d.review} />
          <ShieldAlert className="size-3.5 opacity-60" />
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative overflow-hidden bg-primary">
      <div className="flex w-max animate-marquee py-2">
        {strip}
        {strip}
      </div>
      <span className="sr-only">
        <CopyText copy={d.goldenRule.screenReader} review={d.review} />
      </span>
    </div>
  );
}

export function SiteHeader({ d }: { d: Dictionary }) {
  const nav = [
    { href: "#demo", label: d.nav.demo },
    { href: "#verdicts", label: d.nav.verdicts },
    { href: "#signals", label: d.nav.how },
    { href: "#markets", label: d.nav.markets },
    { href: "#agents", label: d.nav.agents },
    { href: "#audit", label: d.nav.audit },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:gap-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={d.nav.homeLabel.text}>
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight">SecureVoice Shield</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:block">
              <CopyText copy={d.nav.brand} review={d.review} />
            </span>
          </span>
        </Link>

        <nav aria-label={d.nav.main.text} className="ml-auto hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <CopyText copy={n.label} review={d.review} />
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-2 sm:gap-3">
          <ThemeToggle />
          <ModePill compact />
          <a
            href="#demo"
            className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-transform hover:-translate-y-px md:inline-flex"
          >
            <CopyText copy={d.nav.runCheck} review={d.review} />
          </a>
          <MobileNav
            openLabel={d.nav.openMenu.text}
            closeLabel={d.nav.closeMenu.text}
            runCheckLabel={d.nav.runCheck.text}
            ariaLabel={d.nav.mobile.text}
            links={nav.map((n) => ({ href: n.href, label: n.label.text }))}
          />
        </div>
      </div>
    </header>
  );
}

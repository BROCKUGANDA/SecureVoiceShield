import Link from "next/link";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { ModePill } from "./mode-pill";
import { ThemeToggle } from "./theme-toggle";
import { MobileNav } from "./mobile-nav";

const NAV = [
  { href: "#demo", label: "Live demo" },
  { href: "#verdicts", label: "Verdicts" },
  { href: "#signals", label: "How it works" },
  { href: "#markets", label: "Markets" },
  { href: "#agents", label: "Agents" },
  { href: "#audit", label: "Audit chain" },
];

/** The golden rule is a product surface, not a slogan (01, 12). */
export function GoldenRuleBar() {
  const items = [
    "Shield never calls you first",
    "Never share your PIN or any code",
    "Hang up and call back on a number you already know",
    "A missing check never counts as good news",
  ];
  const strip = (
    <div className="flex shrink-0 items-center" aria-hidden>
      {items.map((t) => (
        <span key={t} className="flex items-center gap-6 pr-6 font-mono text-[11px] uppercase tracking-[0.18em] text-primary-foreground/85">
          {t}
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
        Golden rule: Shield never calls you first. Never share your PIN or any code.
      </span>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SecureVoice Shield home">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="size-5" strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight">SecureVoice Shield</span>
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:block">
              Is this voice real?
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
            >
              {n.label}
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
            Run a check
          </a>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

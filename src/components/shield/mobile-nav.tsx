"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#demo", label: "Live demo" },
  { href: "#verdicts", label: "Verdicts" },
  { href: "#signals", label: "How it works" },
  { href: "#markets", label: "Markets" },
  { href: "#agents", label: "Agents" },
  { href: "#audit", label: "Audit chain" },
];

/**
 * Mobile navigation: the desktop nav is hidden below `lg`, so small screens
 * get a keyboard- and screen-reader-friendly disclosure panel instead.
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-10 place-items-center rounded-full border border-border text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
      >
        {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
      </button>

      <div
        id="mobile-nav"
        ref={panelRef}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-border bg-background shadow-lg"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <ul className="grid gap-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-base font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#demo"
            onClick={() => setOpen(false)}
            className="mt-3 flex min-h-11 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            Run a check
          </a>
        </nav>
      </div>
    </div>
  );
}

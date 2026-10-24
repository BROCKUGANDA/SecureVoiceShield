"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

/**
 * Mobile navigation: the desktop nav is hidden below `lg`, so small screens
 * get a keyboard- and screen-reader-friendly disclosure panel instead.
 *
 * The labels arrive as plain strings so only the navigation copy crosses
 * the client boundary — the dictionary itself stays on the server.
 */
export function MobileNav({
  links,
  openLabel,
  closeLabel,
  runCheckLabel,
  ariaLabel,
}: {
  links: { href: string; label: string }[];
  openLabel: string;
  closeLabel: string;
  runCheckLabel: string;
  ariaLabel: string;
}) {
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
        aria-label={open ? closeLabel : openLabel}
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
        <nav aria-label={ariaLabel} className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <ul className="grid gap-1">
            {links.map((l) => (
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
            {runCheckLabel}
          </a>
        </nav>
      </div>
    </div>
  );
}

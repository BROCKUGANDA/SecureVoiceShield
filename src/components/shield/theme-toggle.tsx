"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Three-way toggle cycling light → dark → system.
 * Static label and title: next-themes can resolve the stored theme before
 * hydration, so any dynamic label risks a hydration mismatch. The visible
 * state still comes from the icon pair driven by `dark:` CSS variants.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  function cycle() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label="Toggle theme: cycles light, dark, system"
      title="Theme: light / dark / system"
      className="grid size-9 place-items-center rounded-full border border-border text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Sun className="size-4 dark:hidden" aria-hidden />
      <Moon className="hidden size-4 dark:block" aria-hidden />
    </button>
  );
}

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Light/dark/system theming on the KANGA palettes defined in globals.css. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}

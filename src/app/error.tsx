"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { VerdictGlyph } from "@/components/shield/verdict";

/**
 * Route-level error boundary (05, F-10): failures degrade loudly. An
 * unexpected error is Inconclusive territory — never "everything is fine".
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in server logs / observability; no user-facing stack traces.
    console.error("shield/ui-error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center px-4 py-20">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto w-fit">
          <VerdictGlyph verdict="inconclusive" size={64} />
        </div>
        <h1 className="mt-5 text-xl font-bold">Something went wrong on our side</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The page could not finish rendering. Nothing about your safety has changed: never share
          your PIN or any code, and hang up on anything that asks.
          {error?.digest && (
            <span className="mt-2 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">
              ref {error.digest}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px"
        >
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </button>
      </div>
    </div>
  );
}

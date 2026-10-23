import Link from "next/link";
import { VerdictGlyph } from "@/components/shield/verdict";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 py-20">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto w-fit">
          <VerdictGlyph verdict="inconclusive" size={64} />
        </div>
        <p className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          404 · dashed circle
        </p>
        <h1 className="mt-2 text-xl font-bold">This page can&rsquo;t be verified</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          There is nothing here — and Shield will never pretend otherwise. Anything claiming to be
          Shield and calling you first is a scam.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px"
        >
          Back to Shield
        </Link>
      </div>
    </div>
  );
}

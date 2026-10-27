import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/shield-engine";
import { VERDICT_META } from "@/lib/shield-engine";

/**
 * KANGA verdict glyphs — a hollow circle, a triangle, an octagon, a dashed
 * circle and a shield-tick. Every verdict pairs shape, colour, word and a
 * haptic pattern so it never relies on colour alone (01).
 */

export function verdictText(verdict: Verdict): string {
  return {
    clear: "text-verdict-clear",
    caution: "text-verdict-caution",
    danger: "text-verdict-danger",
    inconclusive: "text-verdict-unknown",
    verified: "text-verdict-verified",
  }[verdict];
}

export function verdictBorder(verdict: Verdict): string {
  return {
    clear: "border-verdict-clear/45",
    caution: "border-verdict-caution/45",
    danger: "border-verdict-danger/45",
    inconclusive: "border-verdict-unknown/45",
    verified: "border-verdict-verified/45",
  }[verdict];
}

export function VerdictGlyph({
  verdict,
  size = 56,
  className,
  strokeWidth = 2.4,
}: {
  verdict: Verdict;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const color = `var(--verdict-${verdict === "verified" ? "verified" : verdict})`;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    fill: "none",
    className: cn("shrink-0", className),
    "aria-hidden": true,
  } as const;

  switch (verdict) {
    case "clear":
      return (
        <svg {...common}>
          <circle cx="24" cy="24" r="17" stroke={color} strokeWidth={strokeWidth} />
          <circle cx="24" cy="24" r="9.5" stroke={color} strokeWidth={strokeWidth} opacity="0.35" />
        </svg>
      );
    case "caution":
      return (
        <svg {...common}>
          <path
            d="M24 7 L43 40 L5 40 Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            transform="translate(0 -1)"
          />
          <line x1="24" y1="19" x2="24" y2="29" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <circle cx="24" cy="34" r="1.6" fill={color} />
        </svg>
      );
    case "danger":
      return (
        <svg {...common}>
          <path
            d="M16.2 5h15.6L43 16.2v15.6L31.8 43H16.2L5 31.8V16.2L16.2 5Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <line x1="17" y1="17" x2="31" y2="31" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="31" y1="17" x2="17" y2="31" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </svg>
      );
    case "inconclusive":
      return (
        <svg {...common}>
          <circle
            cx="24"
            cy="24"
            r="17"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray="5.5 6.5"
            strokeLinecap="round"
          />
          <circle cx="24" cy="24" r="3" fill={color} opacity="0.55" />
        </svg>
      );
    case "verified":
      return (
        <svg {...common}>
          <path
            d="M24 4l7.6 3.1a10 10 0 0 1 6.2 9.2v6.2c0 8.5-5.2 15.3-13.8 20.5C15.4 37.8 10.2 31 10.2 22.5v-6.2a10 10 0 0 1 6.2-9.2L24 4Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <path
            d="M17.5 23.5l4.6 4.6 8.4-9"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/** The four paired channels, shown on every result card. */
export function HapticPulses({ count, className }: { count: number; className?: string }) {
  if (count === 0) {
    return <span className={cn("font-mono text-[11px] uppercase tracking-widest text-muted-foreground", className)}>haptic · none</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-label={`haptic pattern, ${count} pulse${count > 1 ? "s" : ""}`}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="haptic-dot inline-block size-2 rounded-full bg-current"
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

export interface VerdictResult {
  verdict: Verdict;
  reasons: string[];
  reasonCopy?: string[];
  recommendedAction?: string;
  latencyMs?: number;
  auditSeq?: number;
}

export function VerdictCard({
  result,
  title = "Shield result",
  footer,
  className,
}: {
  result: VerdictResult;
  title?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  const meta = VERDICT_META[result.verdict];
  return (
    <div
      role="status"
      className={cn(
        "animate-line-in relative overflow-hidden rounded-2xl border bg-card p-5 shadow-[0_1px_0_rgba(22,36,30,0.04),0_12px_32px_-18px_rgba(22,36,30,0.28)]",
        verdictBorder(result.verdict),
        className,
      )}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1", {
        "bg-verdict-clear": result.verdict === "clear",
        "bg-verdict-caution": result.verdict === "caution",
        "bg-verdict-danger": result.verdict === "danger",
        "bg-verdict-unknown": result.verdict === "inconclusive",
        "bg-verdict-verified": result.verdict === "verified",
      })} />
      <div className="flex items-start gap-4">
        <VerdictGlyph verdict={result.verdict} size={52} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
          <p className={cn("mt-0.5 text-lg font-semibold leading-tight", verdictText(result.verdict))}>{meta.name}</p>
          <p className="mt-1 text-sm font-medium text-foreground/90">{meta.wording}</p>
          {result.reasonCopy && result.reasonCopy.length > 0 && (
            <ul className="mt-2 space-y-1">
              {result.reasonCopy.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                  {r}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-border/70 pt-3 text-sm text-foreground/85">
            <span className="font-semibold">What to do: </span>
            {meta.advice}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/70 pt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>{meta.shape}</span>
        <span aria-hidden>·</span>
        <HapticPulses count={meta.hapticPulses} />
        {result.recommendedAction && (
          <>
            <span aria-hidden>·</span>
            <span>api: {result.recommendedAction}</span>
          </>
        )}
        {typeof result.latencyMs === "number" && (
          <>
            <span aria-hidden>·</span>
            <span>{result.latencyMs} ms</span>
          </>
        )}
        {typeof result.auditSeq === "number" && (
          <>
            <span aria-hidden>·</span>
            <span>audit #{result.auditSeq}</span>
          </>
        )}
      </div>
      {footer}
    </div>
  );
}

import { cn } from "@/lib/utils";

/** Dark console frame shared by all demo tabs. */
export function ConsoleFrame({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-console-line bg-console shadow-[0_30px_80px_-40px_rgba(14,25,19,0.6)]">
      <div className="flex items-center justify-between border-b border-console-line px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-verdict-danger/70" />
            <span className="size-2.5 rounded-full bg-verdict-caution/70" />
            <span className="size-2.5 rounded-full bg-verdict-clear/70" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-console-ink/60">{title}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-console-ink/50">
          {right}
          <span className="hidden sm:inline">sandbox · cell ug</span>
        </div>
      </div>
      <div className="p-5 sm:p-7">{children}</div>
    </div>
  );
}

/** A pipeline log line, revealed one by one. */
export function LogLine({
  id,
  state = "ok",
  children,
}: {
  id?: string;
  state?: "ok" | "flag" | "wait" | "dim";
  children: React.ReactNode;
}) {
  return (
    <div className="animate-line-in flex items-center gap-2.5 font-mono text-[12px] leading-relaxed">
      {id && <span className="w-9 shrink-0 text-console-ink/40">{id}</span>}
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          state === "ok" && "bg-verdict-clear",
          state === "flag" && "bg-verdict-caution",
          state === "wait" && "bg-console-ink/50 animate-blink",
          state === "dim" && "bg-console-ink/30",
        )}
      />
      <span className={cn(state === "dim" ? "text-console-ink/45" : "text-console-ink/85")}>{children}</span>
    </div>
  );
}

export function SandboxChip({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "min-h-9 rounded-full border px-3.5 py-1.5 text-left font-mono text-[11px] tracking-wide transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verdict-verified",
        active
          ? "border-verdict-verified/60 bg-verdict-verified/15 text-verdict-verified"
          : "border-console-line bg-white/[0.03] text-console-ink/75 hover:border-verdict-verified/40 hover:text-verdict-verified",
      )}
    >
      {label}
    </button>
  );
}

export function ConsoleButton({
  children,
  onClick,
  disabled,
  variant = "primary",
  className,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verdict-verified disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary"
          ? "bg-verdict-verified text-white shadow-[0_10px_24px_-10px_rgba(14,95,70,0.8)] hover:brightness-110"
          : "border border-console-line bg-white/[0.04] text-console-ink hover:bg-white/[0.08]",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function RunLog({ lines }: { lines: React.ReactNode[] }) {
  if (lines.length === 0) return null;
  return (
    <div
      className="mt-5 space-y-1.5 rounded-xl border border-console-line bg-black/25 p-4"
      role="log"
      aria-live="polite"
      aria-label="Check pipeline log"
    >
      {lines.map((l, i) => (
        <div key={i}>{l}</div>
      ))}
    </div>
  );
}

/** Error / degraded card rendered from RFC 9457 problem+json. */
export function ProblemCard({ title, code, detail }: { title: string; code: string; detail?: string }) {
  return (
    <div
      role="alert"
      className="mt-5 rounded-2xl border border-verdict-caution/50 bg-verdict-caution/10 p-5"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-verdict-caution">{code}</p>
      <p className="mt-1 font-semibold text-verdict-caution">{title}</p>
      {detail && <p className="mt-1 text-sm text-console-ink/80">{detail}</p>}
    </div>
  );
}

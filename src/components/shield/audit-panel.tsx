"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck, XCircle, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEntry {
  seq: number;
  at: string;
  action: string;
  resource: string;
  reasonCodes: string[];
  policyVersion: string;
  inputDigest: string;
  prevHash: string;
  entryHash: string;
}

interface AuditResponse {
  cell: string;
  total: number;
  integrity: { ok: boolean; checked: number; brokenAt?: number };
  entries: AuditEntry[];
}

const ACTION_TONE: Record<string, string> = {
  "decision.created": "bg-primary/10 text-primary",
  "guardian.completed": "bg-verdict-caution/10 text-verdict-caution",
  "report.received": "bg-verdict-danger/10 text-verdict-danger",
  "verified_call.looked_up": "bg-verdict-verified/10 text-verdict-verified",
};

export function AuditPanel() {
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // Bumping `tick` re-runs the fetch — used by the manual "Re-verify" button.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/audit", { cache: "no-store" });
        const json = (await res.json()) as AuditResponse;
        if (alive) setData(json);
      } catch {
        // keep last known state; never fake a green chain
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [tick]);

  const integrity = data?.integrity;

  return (
    <div className="overflow-hidden rounded-3xl border border-console-line bg-console text-console-ink">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-console-line px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-verdict-verified/15 text-verdict-verified">
            <Link2 className="size-[18px]" />
          </span>
          <div>
            <p className="text-sm font-bold text-console-ink">Evidence log — hash chain · cell {data?.cell ?? "ug"}</p>
            <p className="font-mono text-[10.5px] uppercase tracking-wider text-console-ink/45">
              entryHash = sha256(seq ∥ at ∥ action ∥ resource ∥ reasons ∥ prevHash)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {integrity && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest",
                integrity.ok
                  ? "border-verdict-clear/40 bg-verdict-clear/10 text-verdict-clear"
                  : "border-verdict-danger/50 bg-verdict-danger/10 text-verdict-danger",
              )}
              aria-live="polite"
            >
              {integrity.ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
              {integrity.ok ? `chain verified · ${integrity.checked} entries` : `broken at #${integrity.brokenAt}`}
            </span>
          )}
          <button
            type="button"
            onClick={() => setTick((t) => t + 1)}
            disabled={loading}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-console-line px-3.5 font-mono text-[11px] uppercase tracking-widest text-console-ink/70 transition-colors hover:text-verdict-verified disabled:opacity-50"
          >
            {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Re-verify
          </button>
        </div>
      </div>

      {/* Entries */}
      <div className="nice-scroll max-h-96 overflow-y-auto">
        {data && data.entries.length > 0 ? (
          <ol className="divide-y divide-console-line">
            {data.entries.map((e) => (
              <li key={e.seq} className="grid gap-x-6 gap-y-1 px-5 py-3.5 sm:grid-cols-[86px_1fr_auto] sm:items-center sm:px-6">
                <span className="font-mono text-[12px] text-console-ink/40">#{String(e.seq).padStart(5, "0")}</span>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold",
                        ACTION_TONE[e.action] ?? "bg-white/5 text-console-ink/75",
                      )}
                    >
                      {e.action}
                    </span>
                    {e.reasonCodes.slice(0, 3).map((r) => (
                      <span key={r} className="font-mono text-[10.5px] text-console-ink/45">
                        {r}
                      </span>
                    ))}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10.5px] text-console-ink/40">
                    {e.inputDigest} · policy {e.policyVersion}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[10.5px] text-console-ink/40">
                    {new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(e.at))} UTC
                  </p>
                  <p className="font-mono text-[10.5px] text-verdict-verified/90">{e.entryHash.slice(7, 23)}…</p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="px-6 py-10 text-center font-mono text-[12px] text-console-ink/45">
            {loading ? "loading chain…" : "no entries yet — run a check in the sandbox above"}
          </p>
        )}
      </div>

      {/* Footer note */}
      <div className="border-t border-console-line px-5 py-4 sm:px-6">
        <p className="flex items-start gap-2 text-[13px] leading-relaxed text-console-ink/60">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verdict-verified" />
          Every decision on this page committed an entry in the same transaction. Auditors, banks
          and regulators verify the chain independently with the open-source{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[11.5px] text-verdict-verified">shield-verify</code>{" "}
          tool — no trust in Shield&rsquo;s servers required.
        </p>
      </div>
    </div>
  );
}

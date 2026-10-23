"use client";

import { useEffect, useState } from "react";

interface ModeResponse {
  mode: string;
  modes: { mode: string; scope: string; reason: string }[];
}

/**
 * Live operating-mode pill (05, section 2): reads GET /api/system/mode.
 * Modes degrade loudly — the console, the header and the API header all show it.
 *
 * Polling hygiene: 30 s cadence, paused while the tab is hidden, exponential
 * backoff (up to 2 min) when the probe itself fails, and an immediate refresh
 * when the user returns to the tab.
 */
export function ModePill({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<ModeResponse | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    const schedule = (ms: number) => {
      timer = setTimeout(load, ms);
    };

    const load = async () => {
      // Don't burn requests for an invisible tab — re-probe soon after return.
      if (typeof document !== "undefined" && document.hidden) {
        schedule(15_000);
        return;
      }
      try {
        const res = await fetch("/api/system/mode", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as ModeResponse;
        failures = 0;
        if (alive) setData(json);
        schedule(30_000);
      } catch {
        failures += 1;
        schedule(Math.min(120_000, 10_000 * failures));
      }
    };

    const onVisibility = () => {
      if (!document.hidden) {
        if (timer) clearTimeout(timer);
        load();
      }
    };

    load();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const mode = data?.mode ?? null;
  const degraded = mode !== null && mode !== "NORMAL";

  return (
    <span
      role="status"
      aria-label={`System mode: ${mode ?? "checking"}`}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest ${
        degraded
          ? "border-verdict-caution/50 bg-verdict-caution/10 text-verdict-caution"
          : "border-verdict-clear/40 bg-verdict-clear/10 text-verdict-clear"
      }`}
      title={data?.modes.map((m) => `${m.mode}: ${m.reason}`).join(" · ") || "All systems normal"}
    >
      <span
        className={`size-1.5 rounded-full ${degraded ? "bg-verdict-caution animate-blink" : "bg-verdict-clear"}`}
      />
      {mode ?? "…"}
      {!compact && data && data.modes.length > 0 && <span className="hidden lg:inline">· {data.modes.length} active</span>}
    </span>
  );
}

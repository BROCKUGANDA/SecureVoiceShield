"use client";

import { useEffect, useState } from "react";

interface ModeResponse {
  mode: string;
  modes: { mode: string; scope: string; reason: string }[];
}

/**
 * Live operating-mode pill (05, section 2): reads GET /api/system/mode.
 * Modes degrade loudly — the console, the header and the API header all show it.
 */
export function ModePill({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<ModeResponse | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/system/mode", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as ModeResponse;
        if (alive) setData(json);
      } catch {
        // Keep last known mode; never fabricate one.
      }
    };
    load();
    const t = setInterval(load, 20_000);
    return () => {
      alive = false;
      clearInterval(t);
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

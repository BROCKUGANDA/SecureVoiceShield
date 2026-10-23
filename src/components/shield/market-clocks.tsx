"use client";

import { useEffect, useState } from "react";

const ZONES: { code: string; city: string; tz: string }[] = [
  { code: "AE", city: "Dubai", tz: "Asia/Dubai" },
  { code: "KE", city: "Nairobi", tz: "Africa/Nairobi" },
  { code: "UG", city: "Kampala", tz: "Africa/Kampala" },
  { code: "TZ", city: "Dar es Salaam", tz: "Africa/Dar_es_Salaam" },
];

/**
 * Live clocks per market (rule T-3): store UTC, display in the viewer's zone.
 * Rendered after mount so server and client markup match.
 */
export function MarketClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (alive) setNow(new Date());
    };
    const raf = requestAnimationFrame(tick);
    const t = setInterval(tick, 1000);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5" aria-label="Local times in launch markets">
      {ZONES.map((z) => (
        <span key={z.code} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-verdict-verified/70" />
          {z.city}
          <b className="text-foreground tabular-nums">
            {now
              ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: z.tz }).format(now)
              : "--:--:--"}
          </b>
        </span>
      ))}
    </div>
  );
}

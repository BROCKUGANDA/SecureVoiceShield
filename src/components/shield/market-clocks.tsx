"use client";

import { useEffect, useState } from "react";

const ZONES: { code: string; city: string; tz: string }[] = [
  { code: "AE", city: "Dubai", tz: "Asia/Dubai" },
  { code: "KE", city: "Nairobi", tz: "Africa/Nairobi" },
  { code: "UG", city: "Kampala", tz: "Africa/Kampala" },
  { code: "TZ", city: "Dar es Salaam", tz: "Africa/Dar_es_Salaam" },
];

/**
 * Live clocks per market (rules T-3 and T-7): store UTC, display in the
 * viewer's zone, and take the time from the server — a device clock is only
 * a hint, so the client's clock is corrected against the server's.
 */
export function MarketClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let alive = true;
    let offset = 0;

    // Ask the server what time it is and correct the device clock against it.
    fetch("/api/health/", { cache: "no-store" })
      .then((res) => res.json())
      .then((body: { timestamp?: string }) => {
        if (!alive || !body.timestamp) return;
        const serverAt = Date.parse(body.timestamp);
        if (Number.isFinite(serverAt)) offset = serverAt - Date.now();
      })
      .catch(() => {
        // Without the server's time the device clock is the best we have.
      });

    const tick = () => {
      if (alive) setNow(new Date(Date.now() + offset));
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

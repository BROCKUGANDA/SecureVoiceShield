# Project Worklog

---
Task ID: 1
Agent: Z.ai Code (main)
Task: Build the SecureVoice Shield product site and interactive sandbox as a single Next.js 16 route, from the pasted 14-part product spec (verdicts, detection engine, Guardian flow, audit chain, operating modes, markets).

Work Log:
- Read the uploaded spec (14 docs: product, agents, evals, edge cases, stack, markets, realtime, integrations, orchestration, security, compliance, discoverability) and surveyed the scaffold (shadcn/ui set, Prisma/SQLite, Tailwind 4, dev server on :3000).
- Designed a KANGA-inspired theme (warm paper `#f6f4ee`, deep emerald `#12533f`, no blue/indigo) with verdict tokens, marquee/radar/haptic-pulse keyframes and console styling in `src/app/globals.css`.
- Replaced `prisma/schema.prisma` with Shield models — `Decision`, `AuditEntry` (hash chain), `ScamReport`, `VerifiedCall` — and pushed with `bun run db:push`.
- Implemented the deterministic engine `src/lib/shield-engine.ts` (pure, no I/O): number rule pack (F-1/F-4 floor rule — unknown signals can never yield Clear), voice-note rule pack (two general detectors must agree; D1 provider-scoped), Guardian scenario pack, challenge-word picker (no repeats, no numbers-as-words, T-14), plain-language reason copy, msisdn masking.
- Implemented `src/lib/audit.ts`: transactional hash-chained evidence log (`entryHash = sha256(seq|at|action|resource|reasons|prevHash)`) plus full-chain recompute (`shield-verify` equivalent) and `src/lib/demo-seed.ts` (verified-call registry: Emirates NBD, Equity, Stanbic, CRDB).
- Built 8 API routes with RFC 9457 problem+json, `Idempotency-Key` replay, `X-Shield-Mode` header and the sandbox magic numbers 0001–0008: `/api/assess`, `/api/voice-check`, `/api/guardian/session`, `/api/guardian/complete`, `/api/verified-calls`, `/api/reports` (GET+POST), `/api/audit`, `/api/system/mode` (SURGE on ≥5 danger decisions/h, TELCO_DEGRADED on recent unknowns).
- Built the UI: golden-rule marquee bar, sticky header with live mode pill, hero with radar/verdict-chip signal console, stats strip (TCRA 17,152 etc.), 4-tab demo console (number check with magic chips + raw JSON peek, voice-note check with detector pipeline + samples, Live Call Guardian with localized scripted timeline and private phone-notification result, verified-call lookup), five-verdict gallery with shape/colour/word/haptic specs, four-signals section, products section (public vs business API with `/v1/assess` snippet), markets grid with live per-market clocks (Intl + IANA zones), agents + invariants chips, three-plane architecture diagram, live hash-chain audit panel with re-verify, AEO-style FAQ accordion, sticky dark footer.
- Composed everything in `src/app/page.tsx` (single route, `min-h-screen flex flex-col` with `mt-auto` footer); updated `layout.tsx` metadata/theme-color; quieted Prisma query logging.
- Verified with agent-browser across desktop (1440px) and mobile (390px): all four tabs' golden paths, magic-number outcomes, report receipt, audit chain integrity badge, FAQ accordion, footer, clocks; fixed issues found (stale Turbopack CSS cache → dev-server restart; `bg-verdict-*/5` overriding `bg-card` → border-only tint + accent strip; duplicate challenge-word keys → word-picker fix; `SimCard` → `CardSim` icon export; dev-only effect lint errors in clock/audit panels → subscription patterns; hero chip overlap; "Danger · Danger" duplicate label).

Stage Summary:
- One route (`/`) plus 8 JSON API routes; SQLite via Prisma; no external services required.
- The page is a faithful, working slice of the spec: deterministic engine decides, agents only talk; every user action writes an auditable hash-chained entry; operating modes degrade loudly; public copy never claims certainty.
- Verified end-to-end in a real browser on desktop and mobile viewports; `bun run lint` clean; dev server healthy on port 3000.
- Key artifacts: `src/lib/shield-engine.ts`, `src/lib/audit.ts`, `src/app/api/**`, `src/components/shield/**`, `src/app/page.tsx`, `src/app/globals.css`.

---
Task ID: 2
Agent: Z.ai Code (main)
Task: UI/UX polish and production hardening pass over the SecureVoice Shield site.

Work Log:
- Hardened `next.config.ts`: CSP (`frame-ancestors` tuned for the sandbox preview instead of X-Frame-Options), nosniff, Referrer-Policy, Permissions-Policy, COOP, HSTS, `poweredByHeader: false`, `allowedDevOrigins: ["*.space-z.ai"]`, `reactStrictMode: true`, global `no-store` on `/api/*`.
- Added `src/lib/rate-limit.ts` (in-memory fixed window per IP+scope) and applied limits to every API route with RFC 9457 429 + `Retry-After` (assess 30/min, voice 20/min, guardian 20/min, reports 10/min, audit 30/min, verified 60/min, mode 120/min).
- Added `src/lib/api.ts` hardening: `no-store` on all responses, `degraded()` helper (503 fail-safe), `readJson`, tighter `sanitizeNumber`. Every API route now catches DB/store failures and fails toward verification (`step_up`/`inconclusive`/hang-up advice) instead of leaking 500s; `/api/system/mode` returns `DEGRADED` when the store is unreachable; `verified-calls` 503 says "hang up and call your bank".
- `appendAudit` retries SQLite "database is locked" up to 3× (evidence must commit, I-3).
- New endpoints: `GET /api/health` (liveness incl. db check, 503 when degraded) and `/api` service index (replaced hello-world).
- Resilience UI: `src/app/error.tsx`, `global-error.tsx`, `not-found.tsx` (on-brand Inconclusive/dashed-circle messaging, never fake-green).
- SEO/presentation assets: `app/robots.ts` (spec-14 flavoured, /api disallowed; removed static public/robots.txt), `app/sitemap.ts`, `app/icon.tsx` (KANGA shield favicon), `app/opengraph-image.tsx` (1200×630 satori card — fixed a satori multi-child/flex error), richer `layout.tsx` metadata (metadataBase, title template, twitter card, viewportFit cover, light/dark theme-color).
- Theme: next-themes provider (class strategy) + header toggle cycling light→dark→system; verified the `.dark` KANGA palette across hero, verdicts, console, markets, architecture, footer. Static labels to avoid hydration mismatch.
- Header/mobile: new `MobileNav` disclosure (Escape-to-close, aria-expanded, solid background), theme toggle, mobile CTA; marquee pauses on hover.
- A11y: skip-to-content link + `main#main`, `scroll-padding-top` for anchored sections, global `:focus-visible` ring, focus rings on console buttons/chips, `role="alert"` problem cards, `role="log"` run logs, reduced-motion kill-switch for all decorative animations, 16px console inputs on mobile (no iOS zoom), footer `safe-area-inset-bottom`.
- UX: forms submit on Enter (number check + verified lookup), client-side E.164 validation with `aria-invalid` + hint, result cards auto-scroll into view (guardian/number/verified, honours reduced motion), verdict cards animate in, audit panel skeleton loading + loud failure state + retry + toasts on re-verify, scam-report toast, raw-JSON copy button, mode pill polls at 30 s with hidden-tab pause + failure backoff.
- Bug fixes found during browser verification: `pickChallengeWords` used signed `>>` (negative index → `null` Luganda words) — now `>>>`, 3 words + number as per spec; verified-lookup magic chip set a number not ending `0006` → `+254700000006`; `ConsoleButton` ignored `type` so forms never submitted on Enter/click-submit — now forwards `type`; voice-check "Run check" always re-ran sample 0 — now re-runs the active sample; OG image satori flex error; api.ts Headers-spread type error.
- Verified with agent-browser (1440×900 and 390×844): all four tabs' golden paths, magic numbers 0001/0004/0008, report + receipt toast, audit re-verify toast ("63 entries recomputed from genesis"), verified-call registry banner, Guardian full timeline incl. auto-scroll to private result, SURGE escalation visible in header pill after 5th danger verdict, dark/light/system themes, mobile nav, skip link focus, 404 page, footer safe area. `bun run lint` clean, `tsc --noEmit` clean for src/, dev server healthy.

Stage Summary:
- The sandbox is now production-shaped: rate-limited, validated, no-store everywhere, fail-safe 503s, health probe, security headers, error boundaries, SEO/OG assets, dark mode, mobile nav and keyboard/a11y support.
- Three real logic bugs fixed (word-picker bit-shift, magic chip number, submit button type) plus voice-check rerun bug — each caught by browser-level verification, not just lint.
- Key artifacts: `next.config.ts`, `src/lib/{api,rate-limit,audit}.ts`, `src/app/api/**`, `src/app/{error,global-error,not-found,robots,sitemap,icon,opengraph-image}.tsx`, `src/components/shield/{theme-provider,theme-toggle,mobile-nav,reveal,copy-button}.tsx`, `globals.css`.

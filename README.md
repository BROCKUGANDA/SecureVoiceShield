# SecureVoice Shield

**Slow down. Verify.** — A fraud-prevention platform that protects people, banks and telcos from voice cloning, caller-ID spoofing and SIM-swap account takeovers.

> A sister product to **SecureVoice AI**. SecureVoice AI is the bank calling the customer to stop fraud. Shield protects the customer, and the bank, when someone else pretends to be either of them using a cloned voice, a spoofed number, or a swapped SIM.

## What it does

- **For everyone (free):** a simple "Is this voice real?" check via WhatsApp, USSD, SMS, app and a live-call Guardian that merges into a suspicious call and asks the caller a liveness question.
- **For banks & telcos (paid API):** one API (`POST /v1/assess`, `POST /v1/otp-guard`) that fuses voice, SIM and number signals into a single decision — allow / step up / hold / block — with a hash-chained evidence log.
- **Never claims certainty.** The best public verdict is "No warning signs found." Missing evidence always becomes "We can't tell", never a good result.

## Architecture at a glance

```
 Channels:  WhatsApp · Live Call Guardian (PSTN) · USSD · SMS · Mobile app · Business API
                                   │
        ┌──────────────────────────┴──────────────────────────┐
        │ CONVERSATION PLANE · ElevenLabs Agents               │  speech, turn-taking, phrasing,
        │ Guardian (voice) · Helper (chat) · KB + RAG          │  language, guardrails
        └──────────────────────────┬──────────────────────────┘
                    server tools   │  (scoped, signed, no verdict power)
        ┌──────────────────────────┴──────────────────────────┐
        │ CONTROL PLANE · Shield Core (deterministic)          │  sessions, challenges, fusion,
        │ policy packs · holds · verified calls · audit chain  │  policy, actions, evidence
        └──────────────────────────┬──────────────────────────┘
        ┌──────────────────────────┴──────────────────────────┐
        │ SIGNAL PLANE                                         │
        │ voice detectors (ElevenLabs · vendor · in-house)     │
        │ telco (CAMARA SIM Swap, Call Forwarding, MTN API)     │
        │ number reputation · scam-script cues · context        │
        └─────────────────────────────────────────────────────┘
```

**No model sits in a decision path.** Models produce signals; a versioned, tested rule pack turns signals into verdicts and actions. The decision engine (`packages/engine`) is pure TypeScript with no I/O, property-tested with fast-check.

## Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | Bun 1.x + TypeScript (strict) |
| API | Next.js App Router (Hono-style route handlers) + Zod + OpenAPI 3.1 |
| Decision engine | Pure TS package, no I/O, fast-check property tests |
| Database | PostgreSQL 16 + pgvector (embeddings) + pg-boss (queues) |
| Cache | Valkey 8 |
| Object storage | S3-compatible with Object Lock (WORM evidence) |
| Console / site | Next.js (App Router), React, TanStack Query/Table, Radix, Tailwind (KANGA tokens) |
| Mobile | Expo (React Native) |
| Detection | Python 3.12, FastAPI, ONNX Runtime (in-house + vendor) |
| Voice AI | ElevenLabs Agents (Guardian, Helper, KB+RAG, Guardrails, Scribe v2) |
| Telephony | Twilio / local SIP trunks, Africa's Talking (SMS/USSD) |
| Telco APIs | CAMARA via aggregator, MTN Uganda direct |
| Infra | Kubernetes per cell, Terraform, Argo CD/Rollouts, Cloudflare edge |
| Observability | OpenTelemetry, Prometheus, Grafana, Loki, Tempo, Sentry |

## Repository layout

```
shield/
├─ apps/                 (api, media-gateway, workers, console, site, mobile, detect)
├─ packages/             (contracts, engine, reliability, channels, telco, tokens, ui, ui-native, i18n, audit, agents, kb, eval)
├─ ml/                   (training, eval, datasets)
├─ kb/                   (knowledge-base Markdown per market/language)
├─ infra/                (terraform, k8s, runbooks)
├─ docs/                 (ADRs, runbooks, design RFCs)
├─ src/                  (Next.js app: pages, API routes, components)
├─ prisma/               (schema + migrations)
├─ scripts/              (checks, seed, verify, certify)
└─ .github/workflows/    (CI, deploy, release)
```

## Quick start

```bash
# 1. Install dependencies
bun install

# 2. Copy env and fill in secrets
cp .env.example .env

# 3. Database
bun run db:push        # creates schema (Postgres or SQLite in dev)
bun run db:generate

# 4. Run
bun run dev            # http://localhost:3000
```

## Environment

See [`.env.example`](.env.example) for the full configuration reference (database, cache, telco, ElevenLabs, observability, knowledge base, feature flags).

## Key invariants (enforced in code)

| ID | Invariant |
| --- | --- |
| I-1 | No Clear on missing evidence |
| I-2 | No generative-model output reaches engine inputs |
| I-3 | Every state-changing write has an idempotency key + audit entry in one transaction |
| I-4 | No personal data in the control plane |
| I-5 | Money is integer minor units |
| I-6 | Public outputs never include scores |
| I-7 | Every number an agent says comes from the registry |
| I-8 | A hold release needs two different approvers |
| I-9 | Audio never touches persistent disk (tmpfs only) |
| I-10 | Every mode change is audited |

## Knowledge base & semantic search

Knowledge-base documents live in `kb/` as reviewed Markdown with front-matter. They are ingested into PostgreSQL with the `pgvector` extension for semantic embedding search, enabling fast RAG retrieval for the Guardian and Helper agents.

- Ingestion points: file watcher, admin upload, Git sync, webhook push.
- Embeddings: OpenAI `text-embedding-3-small` (1536-dim) by default; swappable.
- Storage: `kb_documents` + `kb_embeddings` tables with an HNSW index.

See `docs/adr/0004-knowledge-base-pgvector.md`.

## Message queues & integrations

Async work runs on **pg-boss** (transactional outbox on Postgres). Business integrations use the **port/adapter** pattern: Shield Core depends only on ports (`DetectorPort`, `TelcoPort`, `ChannelPort`, …); vendors are adapters behind them. Every adapter has contract tests and a kill switch.

- Seams: `packages/telco`, `packages/channels`
- Pilot programs: see `docs/pilots/`

## Documentation

- `docs/adr/` — Architecture Decision Records
- `docs/runbooks/` — Incident playbooks and operational runbooks
- `docs/design/rfcs/` — Design RFCs
- Companion spec documents (01–14) describe the full product, platform, markets and compliance.

## Scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Dev server |
| `bun run build` | Production build |
| `bun run test` | Unit + property tests |
| `bun run lint` | ESLint |
| `bun run check:*` | Data-class, ports, hreflang, app-manifest, model-registry checks |
| `bun run shield-verify` | Verify the audit chain |
| `bun run shield-certify` | Tenant certification CLI |
| `bun run keygen` | Generate audit signing key |
| `bun run seed:tenant` | Seed sandbox tenant |

## License

Proprietary — SecureVoice Shield. All rights reserved.
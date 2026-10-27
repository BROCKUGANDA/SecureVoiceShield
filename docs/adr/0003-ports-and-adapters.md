# ADR 0003 — Ports and adapters for integrations

**Status:** Accepted

## Context
Banks and telcos use different protocols and SLAs; vendors change.

## Decision
Shield Core depends only on typed ports (`DetectorPort`, `TelcoPort`, `ChannelPort`, `VoicePort`, `MediaPort`, `LlmGatewayPort`, `TenantPort`, `IdentityPort`, `KeyPort`, `ClockPort`, `RandomPort`, `StoragePort`). Each vendor is an adapter in `packages/telco` / `packages/channels`. Adapters map every error to `unknown`, never to a positive/negative signal.

## Consequences
- New vendors need an adapter + contract tests + shadow run before affecting results.
- Lint rule blocks Core from importing adapters.
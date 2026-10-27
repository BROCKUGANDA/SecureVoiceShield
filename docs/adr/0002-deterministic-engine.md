# ADR 0002 — Deterministic decision engine

**Status:** Accepted

## Context
Verdicts must be reproducible, backtestable and auditable. LLMs are non-deterministic.

## Decision
The decision engine (`packages/engine`) is pure TypeScript with no I/O. It accepts only typed signals from deterministic sources (detectors, telco APIs, registry, reputation). Generative model output never reaches engine inputs (invariant I-2). Policies are versioned, signed rule packs.

## Consequences
- Backtests are byte-identical for the same snapshot bundle.
- Agent variants can change without affecting decisions.
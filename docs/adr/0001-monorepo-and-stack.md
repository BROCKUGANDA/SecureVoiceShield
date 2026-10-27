# ADR 0001 — Monorepo and stack

**Status:** Accepted
**Date:** 2026-10-27

## Context
Shield needs one codebase spanning API, engine, web, mobile, detection and ML, with shared contracts.

## Decision
Use a single monorepo with Bun + TypeScript strict everywhere except the Python detection service. Queues on pg-boss (Postgres), cache on Valkey, DB on PostgreSQL 16 with pgvector.

## Consequences
- Shared Zod contracts generate OpenAPI 3.1; breaking changes blocked by oasdiff.
- One runtime (Bun) for tests and builds; Python isolated to `ml/` and `apps/detect`.
# ADR 0005 — pg-boss for message queues

**Status:** Accepted

## Context
Async work (notifications, webhooks, reputation, waves, purge) must be transactional with state changes and survive restarts.

## Decision
Use pg-boss on the cell's Postgres with a transactional outbox. State change and outbox event commit in one transaction. Shedding order and retry policies per queue are defined in the platform spec (02, section 11).

## Consequences
- No separate broker to operate in the pilot.
- Urgent lane (`webhook.urgent`) is never shed.
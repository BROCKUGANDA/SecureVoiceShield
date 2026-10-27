# ADR 0004 — Knowledge base on PostgreSQL + pgvector

**Status:** Accepted

## Context
The Guardian and Helper agents need fast semantic retrieval over a large, multilingual, per-market knowledge base. Multiple ingestion points (file watcher, admin upload, Git sync, webhook) feed it.

## Decision
Store KB documents and their embeddings in PostgreSQL using the `pgvector` extension with an HNSW index. Embedding model defaults to OpenAI `text-embedding-3-small` (1536-dim), swappable via `KB_EMBEDDING_MODEL`. Keep Qdrant as an optional backend (`KB_VECTOR_STORE=qdrant`).

## Consequences
- One durable store per cell; no extra service to operate in the pilot.
- Ingestion is idempotent on document content hash; re-embedding only on change.
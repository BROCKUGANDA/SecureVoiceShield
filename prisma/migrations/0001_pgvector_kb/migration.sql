-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- KbDocument table (mirrors Prisma schema)
CREATE TABLE IF NOT EXISTS "KbDocument" (
  "id"          TEXT PRIMARY KEY,
  "market"      TEXT NOT NULL,
  "language"    TEXT NOT NULL,
  "title"       TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "contentHash" TEXT NOT NULL UNIQUE,
  "source"      TEXT NOT NULL,
  "reviewedBy"  TEXT,
  "reviewedAt"  TIMESTAMP(3),
  "expiresAt"   TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "KbDocument_market_language_idx" ON "KbDocument" ("market", "language");

-- KbEmbedding table with vector column
CREATE TABLE IF NOT EXISTS "KbEmbedding" (
  "id"         TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "KbDocument"("id") ON DELETE CASCADE,
  "chunkIndex" INTEGER NOT NULL,
  "chunkText"  TEXT NOT NULL,
  "embedding"  vector(1536),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "KbEmbedding_documentId_idx" ON "KbEmbedding" ("documentId");

-- HNSW index for fast approximate nearest-neighbour search
CREATE INDEX IF NOT EXISTS "KbEmbedding_embedding_hnsw_idx"
  ON "KbEmbedding" USING hnsw ("embedding" vector_cosine_ops);
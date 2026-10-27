// Knowledge-base ingestion: multiple entry points, idempotent on content hash.
// Embeddings are generated and stored in pgvector for semantic retrieval (ADR 0004).

export type IngestSource = "file" | "upload" | "git" | "webhook" | "admin";

export interface KbIngestInput {
  market: string;          // AE | KE | UG | TZ
  language: string;        // BCP 47
  title: string;
  body: string;
  source: IngestSource;
  reviewedBy?: string;
  reviewedAt?: Date;
  expiresAt?: Date;
}

export interface KbIngestResult {
  documentId: string;
  created: boolean;        // false if content hash already existed
  chunksEmbedded: number;
}

// Chunking: split body into ~500-token chunks with 50-token overlap.
export function chunkText(body: string, maxChars = 2000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < body.length) {
    chunks.push(body.slice(i, i + maxChars));
    i += maxChars - overlap;
    if (i >= body.length) break;
  }
  return chunks.length ? chunks : [body];
}

// Content hash for idempotency (SHA-256 of normalised body).
export async function contentHash(body: string): Promise<string> {
  const enc = new TextEncoder().encode(body.trim().toLowerCase());
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
// Idempotency: every write accepts an Idempotency-Key. Replay returns the
// stored response. Mismatched body returns 409 (02, section 10).

export interface IdempotencyStore {
  get(key: string): Promise<{ body: string; status: number } | null>;
  set(key: string, body: string, status: number, bodyHash: string): Promise<void>;
  getBodyHash(key: string): Promise<string | null>;
}

export async function withIdempotency<T>(
  store: IdempotencyStore,
  key: string,
  bodyHash: string,
  fn: () => Promise<{ body: T; status: number }>,
): Promise<{ body: T; status: number; replayed: boolean }> {
  const existing = await store.get(key);
  if (existing) {
    const storedHash = await store.getBodyHash(key);
    if (storedHash && storedHash !== bodyHash) {
      throw new Error("IDEMPOTENCY_MISMATCH"); // 409
    }
    return { body: JSON.parse(existing.body) as T, status: existing.status, replayed: true };
  }

  const result = await fn();
  await store.set(key, JSON.stringify(result.body), result.status, bodyHash);
  return { ...result, replayed: false };
}
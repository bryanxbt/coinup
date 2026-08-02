import type {
  IdempotencyRecord,
  LedgerAccount,
  LedgerEntry,
} from "./types.js";

/**
 * In-memory ledger store for MVP / local alpha.
 * PR later: swap for Postgres with same LedgerStore interface.
 */

const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

export interface LedgerStore {
  getAccount(playerId: string): LedgerAccount | undefined;
  upsertAccount(account: LedgerAccount): void;
  appendEntry(entry: LedgerEntry): void;
  getIdempotency(key: string): IdempotencyRecord | undefined;
  putIdempotency(rec: IdempotencyRecord): void;
  listEntries(playerId: string, limit?: number): LedgerEntry[];
  reset(): void;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function createMemoryStore(): LedgerStore {
  const accounts = new Map<string, LedgerAccount>();
  const entries: LedgerEntry[] = [];
  const idempotency = new Map<string, IdempotencyRecord>();

  function purgeExpiredIdempotency(): void {
    const cutoff = Date.now() - IDEMPOTENCY_TTL_MS;
    for (const [k, v] of idempotency) {
      if (Date.parse(v.createdAt) < cutoff) {
        idempotency.delete(k);
      }
    }
  }

  return {
    getAccount(playerId) {
      return accounts.get(playerId);
    },
    upsertAccount(account) {
      accounts.set(account.playerId, { ...account, updatedAt: nowIso() });
    },
    appendEntry(entry) {
      entries.push(entry);
    },
    getIdempotency(key) {
      purgeExpiredIdempotency();
      return idempotency.get(key);
    },
    putIdempotency(rec) {
      purgeExpiredIdempotency();
      idempotency.set(rec.key, rec);
    },
    listEntries(playerId, limit = 50) {
      return entries
        .filter((e) => e.playerId === playerId)
        .slice(-limit)
        .reverse();
    },
    reset() {
      accounts.clear();
      entries.length = 0;
      idempotency.clear();
    },
  };
}

/** Singleton for the API process. Tests should call createMemoryStore(). */
export const defaultStore = createMemoryStore();

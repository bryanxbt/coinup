import { createHash, randomUUID } from "node:crypto";
import { assertSats, DEFAULT_MAX_STACK_SATS, LedgerError } from "./sats.js";
import type { LedgerStore } from "./memory-store.js";
import { defaultStore } from "./memory-store.js";
import type {
  ArcadeBalance,
  LedgerAccount,
  LedgerEntry,
  LedgerOp,
  MoneyResult,
  PaymentNetwork,
} from "./types.js";

function emptyAccount(playerId: string): LedgerAccount {
  return {
    playerId,
    availableSats: 0,
    lockedTableSats: 0,
    lockedTournamentSats: 0,
    lockedBackingSats: 0,
    updatedAt: new Date().toISOString(),
  };
}

function toBalance(
  acc: LedgerAccount,
  network: PaymentNetwork,
): ArcadeBalance {
  const lockedDetail = {
    tableSats: acc.lockedTableSats,
    tournamentSats: acc.lockedTournamentSats,
    backingSats: acc.lockedBackingSats,
  };
  const lockedSats =
    lockedDetail.tableSats +
    lockedDetail.tournamentSats +
    lockedDetail.backingSats;
  return {
    availableSats: acc.availableSats,
    lockedSats,
    lockedDetail,
    network,
  };
}

function assertInvariant(acc: LedgerAccount): void {
  const parts = [
    acc.availableSats,
    acc.lockedTableSats,
    acc.lockedTournamentSats,
    acc.lockedBackingSats,
  ];
  for (const p of parts) {
    if (!Number.isInteger(p) || p < 0 || !Number.isSafeInteger(p)) {
      throw new LedgerError("invariant_broken", 500, "ledger bucket invalid", {
        account: acc,
      });
    }
  }
}

function bodyHash(op: LedgerOp): string {
  const stable = JSON.stringify({
    kind: op.kind,
    playerId: op.playerId,
    amountSats: op.amountSats ?? null,
    agentId: op.agentId ?? null,
    tableId: op.tableId ?? null,
    tournamentId: op.tournamentId ?? null,
    refType: op.refType ?? null,
    refId: op.refId ?? null,
    reason: op.reason ?? null,
    termsId: op.termsId ?? null,
    positionId: op.positionId ?? null,
    payouts: op.payouts ?? null,
  });
  return createHash("sha256").update(stable).digest("hex");
}

function txRef(): string {
  return `tx_${randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

export class LedgerService {
  constructor(
    private readonly store: LedgerStore = defaultStore,
    private readonly network: PaymentNetwork = "mock",
  ) {}

  getBalance(playerId: string): ArcadeBalance {
    if (!playerId) {
      throw new LedgerError("invalid_player", 400, "playerId required");
    }
    const acc = this.store.getAccount(playerId) ?? emptyAccount(playerId);
    return toBalance(acc, this.network);
  }

  listEntries(playerId: string, limit = 50) {
    return this.store.listEntries(playerId, limit);
  }

  apply(op: LedgerOp): MoneyResult {
    if (!op.idempotencyKey || typeof op.idempotencyKey !== "string") {
      throw new LedgerError(
        "missing_idempotency_key",
        400,
        "idempotencyKey is required",
      );
    }
    if (!op.playerId) {
      throw new LedgerError("invalid_player", 400, "playerId required");
    }

    const hash = bodyHash(op);
    const existing = this.store.getIdempotency(op.idempotencyKey);
    if (existing) {
      if (existing.bodyHash !== hash) {
        throw new LedgerError(
          "idempotency_conflict",
          409,
          "idempotency key reused with different body",
          { key: op.idempotencyKey },
        );
      }
      return JSON.parse(existing.responseJson) as MoneyResult;
    }

    const acc =
      this.store.getAccount(op.playerId) ?? emptyAccount(op.playerId);
    const result = this.applyMutating(acc, op);
    assertInvariant(acc);
    this.store.upsertAccount(acc);

    const entry: LedgerEntry = {
      id: randomUUID(),
      playerId: op.playerId,
      kind: op.kind,
      amountSats: op.amountSats ?? 0,
      deltaAvailable: result.deltaAvailable,
      deltaLockedTable: result.deltaLockedTable,
      deltaLockedTournament: result.deltaLockedTournament,
      deltaLockedBacking: result.deltaLockedBacking,
      refType: op.tableId
        ? "table"
        : op.tournamentId
          ? "tournament"
          : op.refType,
      refId: op.tableId ?? op.tournamentId ?? op.refId,
      agentId: op.agentId,
      txRef: result.txRef,
      idempotencyKey: op.idempotencyKey,
      createdAt: new Date().toISOString(),
      meta: {
        reason: op.reason,
        termsId: op.termsId,
        positionId: result.positionId,
      },
    };
    this.store.appendEntry(entry);

    const money: MoneyResult & { positionId?: string } = {
      txRef: result.txRef,
      balance: toBalance(acc, this.network),
    };
    if (result.positionId) {
      money.positionId = result.positionId;
    }

    this.store.putIdempotency({
      key: op.idempotencyKey,
      bodyHash: hash,
      txRef: result.txRef,
      responseJson: JSON.stringify(money),
      createdAt: new Date().toISOString(),
    });

    return money;
  }

  private applyMutating(
    acc: LedgerAccount,
    op: LedgerOp,
  ): {
    txRef: string;
    deltaAvailable: number;
    deltaLockedTable: number;
    deltaLockedTournament: number;
    deltaLockedBacking: number;
    positionId?: string;
  } {
    const ref = txRef();
    let dA = 0;
    let dT = 0;
    let dTour = 0;
    let dB = 0;
    let positionId: string | undefined;

    switch (op.kind) {
      case "faucet":
      case "deposit": {
        const amount = assertSats(op.amountSats);
        if (amount === 0) {
          throw new LedgerError("invalid_sats", 400, "amount must be > 0");
        }
        acc.availableSats += amount;
        dA = amount;
        break;
      }
      case "withdraw":
      case "insert_coin": {
        const amount = assertSats(op.amountSats);
        if (amount === 0) {
          throw new LedgerError("invalid_sats", 400, "amount must be > 0");
        }
        if (acc.availableSats < amount) {
          throw new LedgerError(
            "insufficient_available",
            402,
            "insufficient available sats",
            { available: acc.availableSats, need: amount },
          );
        }
        acc.availableSats -= amount;
        dA = -amount;
        break;
      }
      case "buy_in": {
        const amount = assertSats(
          op.amountSats,
          DEFAULT_MAX_STACK_SATS,
        );
        if (amount === 0) {
          throw new LedgerError("invalid_sats", 400, "amount must be > 0");
        }
        if (!op.tableId || !op.agentId) {
          throw new LedgerError(
            "invalid_request",
            400,
            "tableId and agentId required for buy_in",
          );
        }
        if (acc.availableSats < amount) {
          throw new LedgerError(
            "insufficient_available",
            402,
            "insufficient available sats for buy-in",
            { available: acc.availableSats, need: amount },
          );
        }
        acc.availableSats -= amount;
        acc.lockedTableSats += amount;
        dA = -amount;
        dT = amount;
        break;
      }
      case "cash_out_table": {
        const amount = assertSats(op.amountSats, DEFAULT_MAX_STACK_SATS);
        if (!op.tableId) {
          throw new LedgerError("invalid_request", 400, "tableId required");
        }
        if (acc.lockedTableSats < amount) {
          throw new LedgerError(
            "insufficient_locked",
            402,
            "insufficient locked table sats",
            { locked: acc.lockedTableSats, need: amount },
          );
        }
        acc.lockedTableSats -= amount;
        acc.availableSats += amount;
        dT = -amount;
        dA = amount;
        break;
      }
      case "tournament_entry": {
        const amount = assertSats(op.amountSats, DEFAULT_MAX_STACK_SATS);
        if (!op.tournamentId || !op.agentId) {
          throw new LedgerError(
            "invalid_request",
            400,
            "tournamentId and agentId required",
          );
        }
        if (acc.availableSats < amount) {
          throw new LedgerError(
            "insufficient_available",
            402,
            "insufficient available sats for tournament entry",
          );
        }
        acc.availableSats -= amount;
        acc.lockedTournamentSats += amount;
        dA = -amount;
        dTour = amount;
        break;
      }
      case "refund_entry": {
        const amount = assertSats(op.amountSats ?? 0);
        if (!op.refType || !op.refId) {
          throw new LedgerError(
            "invalid_request",
            400,
            "refType and refId required for refund",
          );
        }
        if (amount === 0) {
          throw new LedgerError(
            "invalid_sats",
            400,
            "amountSats required for refund_entry in v0",
          );
        }
        if (op.refType === "table_buy_in") {
          if (acc.lockedTableSats < amount) {
            throw new LedgerError(
              "insufficient_locked",
              402,
              "insufficient locked table for refund",
            );
          }
          acc.lockedTableSats -= amount;
          acc.availableSats += amount;
          dT = -amount;
          dA = amount;
        } else if (op.refType === "tournament") {
          if (acc.lockedTournamentSats < amount) {
            throw new LedgerError(
              "insufficient_locked",
              402,
              "insufficient locked tournament for refund",
            );
          }
          acc.lockedTournamentSats -= amount;
          acc.availableSats += amount;
          dTour = -amount;
          dA = amount;
        } else {
          throw new LedgerError("invalid_request", 400, "unknown refType");
        }
        break;
      }
      case "lock_backing": {
        const amount = assertSats(op.amountSats);
        if (!op.agentId || !op.termsId) {
          throw new LedgerError(
            "invalid_request",
            400,
            "agentId and termsId required for lock_backing",
          );
        }
        if (acc.availableSats < amount) {
          throw new LedgerError(
            "insufficient_available",
            402,
            "insufficient available sats for backing",
          );
        }
        acc.availableSats -= amount;
        acc.lockedBackingSats += amount;
        dA = -amount;
        dB = amount;
        positionId = `bk_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
        break;
      }
      case "release_backing": {
        // v0: release principal back to player (full or partial via amountSats)
        const amount = assertSats(op.amountSats ?? 0);
        if (amount === 0) {
          throw new LedgerError(
            "invalid_sats",
            400,
            "amountSats required for release_backing v0",
          );
        }
        if (acc.lockedBackingSats < amount) {
          throw new LedgerError(
            "insufficient_locked",
            402,
            "insufficient locked backing",
          );
        }
        acc.lockedBackingSats -= amount;
        acc.availableSats += amount;
        dB = -amount;
        dA = amount;
        break;
      }
      default: {
        const _exhaustive: never = op.kind;
        throw new LedgerError(
          "unknown_op",
          400,
          `unknown ledger op: ${String(_exhaustive)}`,
        );
      }
    }

    return {
      txRef: ref,
      deltaAvailable: dA,
      deltaLockedTable: dT,
      deltaLockedTournament: dTour,
      deltaLockedBacking: dB,
      positionId,
    };
  }
}

export function createLedgerService(
  store?: LedgerStore,
  network: PaymentNetwork = "mock",
): LedgerService {
  return new LedgerService(store ?? defaultStore, network);
}

import type { Sats } from "./sats.js";

export type PaymentNetwork =
  | "arch-localnet"
  | "arch-testnet"
  | "arch-mainnet"
  | "mock";

export interface LockedBreakdown {
  tableSats: Sats;
  tournamentSats: Sats;
  backingSats: Sats;
}

export interface ArcadeBalance {
  availableSats: Sats;
  lockedSats: Sats;
  lockedDetail: LockedBreakdown;
  network: PaymentNetwork;
}

export interface MoneyResult {
  txRef: string;
  balance: ArcadeBalance;
}

export type LockBucket = "table" | "tournament" | "backing";

export type LedgerOpKind =
  | "faucet"
  | "deposit"
  | "withdraw"
  | "buy_in"
  | "cash_out_table"
  | "tournament_entry"
  | "refund_entry"
  | "lock_backing"
  | "release_backing"
  | "insert_coin";

export interface LedgerAccount {
  playerId: string;
  availableSats: Sats;
  lockedTableSats: Sats;
  lockedTournamentSats: Sats;
  lockedBackingSats: Sats;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  playerId: string;
  kind: LedgerOpKind;
  amountSats: Sats;
  /** +available / -available / +lock / -lock encoded in delta fields */
  deltaAvailable: Sats;
  deltaLockedTable: Sats;
  deltaLockedTournament: Sats;
  deltaLockedBacking: Sats;
  refType?: string;
  refId?: string;
  agentId?: string;
  txRef: string;
  idempotencyKey: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}

export interface IdempotencyRecord {
  key: string;
  bodyHash: string;
  txRef: string;
  responseJson: string;
  createdAt: string;
}

export interface LedgerOpBase {
  kind: LedgerOpKind;
  playerId: string;
  idempotencyKey: string;
  amountSats?: Sats;
  agentId?: string;
  tableId?: string;
  tournamentId?: string;
  refType?: string;
  refId?: string;
  reason?: string;
  termsId?: string;
  positionId?: string;
  /** For release_backing multi-payout later */
  payouts?: { playerId: string; amountSats: Sats }[];
}

export type LedgerOp = LedgerOpBase;

import type { Sats } from "./sats";

export type { Sats } from "./sats";
export {
  MAX_SATS_NUMBER,
  DEFAULT_MAX_STACK_SATS,
  assertSats,
  formatSats,
} from "./sats";

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
  /** Sum of all lock buckets. */
  lockedSats: Sats;
  lockedDetail?: LockedBreakdown;
  network: PaymentNetwork;
}

/** Optional on Floor 1 browser types; required on Card Room server wire. */
export interface MoneyMeta {
  idempotencyKey?: string;
}

export interface DepositRequest extends MoneyMeta {
  amountSats: Sats;
  playerId: string;
}

export interface InsertCoinRequest extends MoneyMeta {
  gameId: string;
  costSats: Sats;
  playerId: string;
}

export interface InsertCoinResult {
  sessionId: string;
  remainingSats: Sats;
  txRef?: string;
}

export interface ScoreSubmission extends MoneyMeta {
  gameId: string;
  sessionId: string;
  playerId: string;
  score: number;
  scoreCommitment?: string;
}

export interface RewardClaim extends MoneyMeta {
  potId: string;
  playerId: string;
  amountSats: Sats;
}

export interface MoneyResult {
  txRef: string;
  balance: ArcadeBalance;
}

/** Card Room server wire — required key. */
export type RequireIdempotency<T extends MoneyMeta> = Omit<T, "idempotencyKey"> & {
  idempotencyKey: string;
};

export type CrBuyInRequest = RequireIdempotency<{
  playerId: string;
  tableId: string;
  amountSats: Sats;
  agentId: string;
  idempotencyKey?: string;
}>;

export type CrTournamentEntryRequest = RequireIdempotency<{
  playerId: string;
  tournamentId: string;
  amountSats: Sats;
  agentId: string;
  idempotencyKey?: string;
}>;

export type CrCashOutTableRequest = RequireIdempotency<{
  playerId: string;
  tableId: string;
  agentId: string;
  /** Stack returned to available (engine-authoritative). */
  amountSats: Sats;
  idempotencyKey?: string;
}>;

export type CrBackingLockRequest = RequireIdempotency<{
  playerId: string;
  agentId: string;
  amountSats: Sats;
  termsId: string;
  idempotencyKey?: string;
}>;

export type CrRefundEntryRequest = RequireIdempotency<{
  playerId: string;
  refType: "tournament" | "table_buy_in";
  refId: string;
  reason: string;
  /** Optional explicit amount; otherwise reverse original lock if tracked. */
  amountSats?: Sats;
  idempotencyKey?: string;
}>;

export type CrWithdrawRequest = RequireIdempotency<{
  playerId: string;
  amountSats: Sats;
  idempotencyKey?: string;
}>;

export type CrFaucetRequest = RequireIdempotency<{
  playerId: string;
  amountSats: Sats;
  idempotencyKey?: string;
}>;

/**
 * Floor 1 PaymentClient — compatible with existing call sites.
 * Card Room UI uses CrPaymentClient against the server.
 */
export interface PaymentClient {
  network: PaymentNetwork;
  getBalance(playerId: string): Promise<ArcadeBalance>;
  deposit(req: DepositRequest): Promise<ArcadeBalance>;
  insertCoin(req: InsertCoinRequest): Promise<InsertCoinResult>;
  submitScore(sub: ScoreSubmission): Promise<{ accepted: boolean; txRef?: string }>;
  claimReward(req: RewardClaim): Promise<ArcadeBalance>;
  withdraw(playerId: string, amountSats: Sats): Promise<ArcadeBalance>;
  buyIn?(req: CrBuyInRequest): Promise<MoneyResult>;
  tournamentEntry?(req: CrTournamentEntryRequest): Promise<MoneyResult>;
  cashOutTable?(req: CrCashOutTableRequest): Promise<MoneyResult>;
  lockBacking?(
    req: CrBackingLockRequest,
  ): Promise<MoneyResult & { positionId: string }>;
  refundEntry?(req: CrRefundEntryRequest): Promise<MoneyResult>;
}

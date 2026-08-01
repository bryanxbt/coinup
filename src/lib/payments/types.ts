/** All monetary values in integer satoshis. */
export type Sats = number;

export type PaymentNetwork = "arch-localnet" | "arch-testnet" | "arch-mainnet" | "mock";

export interface ArcadeBalance {
  availableSats: Sats;
  lockedSats: Sats;
  network: PaymentNetwork;
}

export interface DepositRequest {
  amountSats: Sats;
  /** Player destination for credit mint / deposit note. */
  playerId: string;
}

export interface InsertCoinRequest {
  gameId: string;
  costSats: Sats;
  playerId: string;
}

export interface InsertCoinResult {
  sessionId: string;
  remainingSats: Sats;
  txRef?: string;
}

export interface ScoreSubmission {
  gameId: string;
  sessionId: string;
  playerId: string;
  score: number;
  /** Optional commitment for later verification. */
  scoreCommitment?: string;
}

export interface RewardClaim {
  potId: string;
  playerId: string;
  amountSats: Sats;
}

/**
 * Client-facing payment surface.
 * Mock implementation today; Arch program client later.
 */
export interface PaymentClient {
  network: PaymentNetwork;
  getBalance(playerId: string): Promise<ArcadeBalance>;
  deposit(req: DepositRequest): Promise<ArcadeBalance>;
  insertCoin(req: InsertCoinRequest): Promise<InsertCoinResult>;
  submitScore(sub: ScoreSubmission): Promise<{ accepted: boolean; txRef?: string }>;
  withdraw(playerId: string, amountSats: Sats): Promise<ArcadeBalance>;
}

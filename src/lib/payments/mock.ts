import type {
  ArcadeBalance,
  DepositRequest,
  InsertCoinRequest,
  InsertCoinResult,
  PaymentClient,
  ScoreSubmission,
  Sats,
} from "./types";
import { formatSats } from "./sats";

const STORAGE_KEY = "coinup.mock.balance.v1";
const DEFAULT_STARTING_SATS: Sats = 50_000; // 0.0005 BTC — demo pocket change

function autoIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readBalance(): ArcadeBalance {
  if (typeof window === "undefined") {
    return {
      availableSats: DEFAULT_STARTING_SATS,
      lockedSats: 0,
      lockedDetail: { tableSats: 0, tournamentSats: 0, backingSats: 0 },
      network: "mock",
    };
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial: ArcadeBalance = {
      availableSats: DEFAULT_STARTING_SATS,
      lockedSats: 0,
      lockedDetail: { tableSats: 0, tournamentSats: 0, backingSats: 0 },
      network: "mock",
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  const parsed = JSON.parse(raw) as ArcadeBalance;
  if (!parsed.lockedDetail) {
    parsed.lockedDetail = {
      tableSats: 0,
      tournamentSats: 0,
      backingSats: 0,
    };
  }
  if (typeof parsed.lockedSats !== "number") {
    parsed.lockedSats = 0;
  }
  return parsed;
}

function writeBalance(balance: ArcadeBalance): ArcadeBalance {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(balance));
  }
  return balance;
}

function sessionId(): string {
  return `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Floor 1 browser-local sat credits.
 * Not multi-party safe — Card Room uses server ledger via browser-client.ts.
 */
export const mockPaymentClient: PaymentClient = {
  network: "mock",

  async getBalance(_playerId) {
    return readBalance();
  },

  async deposit(req: DepositRequest) {
    void req.idempotencyKey; // optional Floor 1; no server dedupe
    const bal = readBalance();
    bal.availableSats += req.amountSats;
    return writeBalance(bal);
  },

  async insertCoin(req: InsertCoinRequest): Promise<InsertCoinResult> {
    const key = req.idempotencyKey ?? autoIdempotencyKey();
    void key;
    const bal = readBalance();
    if (bal.availableSats < req.costSats) {
      throw new Error("Not enough sats — insert more coin.");
    }
    bal.availableSats -= req.costSats;
    writeBalance(bal);
    return {
      sessionId: sessionId(),
      remainingSats: bal.availableSats,
      txRef: `mock_${req.gameId}_${Date.now()}`,
    };
  },

  async submitScore(_sub: ScoreSubmission) {
    return { accepted: true, txRef: `mock_score_${Date.now()}` };
  },

  async claimReward(req) {
    const bal = readBalance();
    bal.availableSats += req.amountSats;
    return writeBalance(bal);
  },

  async withdraw(playerId, amountSats) {
    void playerId;
    const bal = readBalance();
    if (bal.availableSats < amountSats) {
      throw new Error("Insufficient credits to withdraw.");
    }
    bal.availableSats -= amountSats;
    return writeBalance(bal);
  },
};

export { formatSats };

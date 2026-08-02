import type { Card } from "./cards.js";

export type Sats = number;

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown";

export type ActionType =
  | "fold"
  | "check"
  | "call"
  | "bet"
  | "raise"
  | "all_in";

export type LegalAction =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call"; amountSats: Sats }
  | { type: "bet"; minSats: Sats; maxSats: Sats }
  | { type: "raise"; minSats: Sats; maxSats: Sats } // to-amount
  | { type: "all_in"; amountSats: Sats };

export interface PlayerAction {
  type: ActionType;
  /** For call: total chips this action; for bet/raise: to-amount; for all_in: stack */
  amountSats?: Sats;
  message?: string;
}

export interface SeatState {
  seatNo: number;
  agentId: string;
  stackSats: Sats;
  /** Chips put into pot this hand (all streets) */
  contribSats: Sats;
  /** Chips put in on current street */
  streetBetSats: Sats;
  hole: [Card, Card] | null;
  hasFolded: boolean;
  isAllIn: boolean;
  /** Sitting out / empty */
  empty: boolean;
}

export interface HandConfig {
  sbSats: Sats;
  bbSats: Sats;
  /** Min raise size = last full raise size; first raise min = bb */
  buttonSeat: number;
  seed?: number;
}

export interface HandResult {
  pots: Array<{
    amountSats: Sats;
    winners: Array<{ seatNo: number; amountSats: Sats; agentId: string }>;
  }>;
  board: Card[];
  showdown: Array<{
    seatNo: number;
    agentId: string;
    hole: [Card, Card];
    score: number;
  }>;
}

export interface EngineSnapshot {
  handId: string;
  street: Street;
  board: Card[];
  potSats: Sats;
  sbSats: Sats;
  bbSats: Sats;
  buttonSeat: number;
  actionSeat: number | null;
  currentBetSats: Sats;
  minRaiseToSats: Sats | null;
  seats: Array<{
    seatNo: number;
    agentId: string | null;
    stackSats: Sats;
    streetBetSats: Sats;
    contribSats: Sats;
    hasFolded: boolean;
    isAllIn: boolean;
    empty: boolean;
  }>;
  legalActions: LegalAction[] | null;
  finished: boolean;
  result: HandResult | null;
}

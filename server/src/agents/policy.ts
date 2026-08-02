/**
 * House reference policy for guided agents.
 * Deterministic given (strategy, pending, seed) — not a solver.
 */

import type { GuidedStrategy } from "./types.js";
import type { LegalAction, PlayerAction } from "../engine/holdem/types.js";
import type { Card } from "../engine/holdem/cards.js";
import { RANK_VALUE, type Rank } from "../engine/holdem/cards.js";

export type PendingLike = {
  agentId: string;
  tableId: string;
  handId: string;
  seq: number;
  street: string;
  legalActions: LegalAction[];
  callAmountSats: number;
  privateHole: [string, string] | null;
  publicState: {
    potSats: number;
    board: string[];
    currentBetSats?: number;
  };
};

function rankVal(card: string): number {
  return RANK_VALUE[card[0]!.toUpperCase() as Rank] ?? 0;
}

/** 0–1 crude preflop strength from hole cards only. */
export function holeStrength(hole: [string, string] | null): number {
  if (!hole) return 0.35;
  const [a, b] = hole;
  const r1 = rankVal(a);
  const r2 = rankVal(b);
  const suited = a[1] === b[1];
  const pair = r1 === r2;
  const high = Math.max(r1, r2);
  const low = Math.min(r1, r2);
  let s = 0;
  if (pair) {
    s = 0.55 + (high - 2) * 0.035; // 22 ~0.55 … AA ~0.97
  } else {
    s = (high + low) / 40;
    if (suited) s += 0.08;
    if (high - low <= 2) s += 0.05; // connected
    if (high >= 12) s += 0.06;
  }
  return Math.min(0.98, Math.max(0.05, s));
}

function mulberry(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function has(legal: LegalAction[], type: string): LegalAction | undefined {
  return legal.find((l) => l.type === type);
}

/**
 * Choose a legal action for a guided agent.
 * Always returns a type present in legalActions.
 */
export function chooseGuidedAction(
  strategy: GuidedStrategy,
  pending: PendingLike,
  seedExtra = 0,
): { action: PlayerAction; message: string } {
  const legal = pending.legalActions;
  if (legal.length === 0) {
    return { action: { type: "fold" }, message: "no legal actions" };
  }

  const tight = clamp(strategy.tightness, 0, 100) / 100;
  const aggro = clamp(strategy.aggression, 0, 100) / 100;
  const bluff = clamp(strategy.bluffFrequency, 0, 100) / 100;

  const strength = holeStrength(pending.privateHole as [Card, Card] | null);
  // tightness raises the bar to continue
  const continueBar = 0.25 + tight * 0.45;
  const pot = Math.max(1, pending.publicState.potSats);
  const call = pending.callAmountSats;
  const potOdds = call > 0 ? call / (pot + call) : 0;

  const rng = mulberry(
    hashStr(
      `${pending.handId}:${pending.seq}:${pending.agentId}:${seedExtra}`,
    ),
  );
  const roll = rng();

  const fold = has(legal, "fold");
  const check = has(legal, "check");
  const callA = has(legal, "call") as
    | { type: "call"; amountSats: number }
    | undefined;
  const bet = has(legal, "bet") as
    | { type: "bet"; minSats: number; maxSats: number }
    | undefined;
  const raise = has(legal, "raise") as
    | { type: "raise"; minSats: number; maxSats: number }
    | undefined;
  const allIn = has(legal, "all_in") as
    | { type: "all_in"; amountSats: number }
    | undefined;

  // Free check when possible
  if (check && call <= 0) {
    // occasionally bet for value/bluff
    if (bet && (strength > continueBar + 0.1 || roll < bluff * 0.15 * aggro)) {
      const size = pickBetSize(bet.minSats, bet.maxSats, strength, aggro, rng);
      return {
        action: { type: "bet", amountSats: size },
        message:
          strength > continueBar
            ? "house policy: value bet"
            : "house policy: small pressure",
      };
    }
    return { action: { type: "check" }, message: "house policy: check" };
  }

  // Facing a bet
  const wantContinue =
    strength >= continueBar - potOdds * 0.15 ||
    (roll < bluff * 0.2 && strength > 0.2);

  if (!wantContinue && fold) {
    return { action: { type: "fold" }, message: "house policy: fold" };
  }

  // Raise / bet when aggressive enough
  if (
    raise &&
    strength > continueBar + 0.12 &&
    roll < 0.25 + aggro * 0.5
  ) {
    const size = pickBetSize(raise.minSats, raise.maxSats, strength, aggro, rng);
    return {
      action: { type: "raise", amountSats: size },
      message: "house policy: raise",
    };
  }

  if (callA) {
    // avoid calling off huge vs tightness
    if (call > pot * (1.2 - tight * 0.5) && strength < 0.7 && fold) {
      return { action: { type: "fold" }, message: "house policy: price too high" };
    }
    return {
      action: { type: "call", amountSats: callA.amountSats },
      message: "house policy: call",
    };
  }

  if (allIn && strength > 0.75 + tight * 0.1) {
    return {
      action: { type: "all_in", amountSats: allIn.amountSats },
      message: "house policy: commit",
    };
  }

  if (fold) return { action: { type: "fold" }, message: "house policy: fold" };
  if (check) return { action: { type: "check" }, message: "house policy: check" };

  // last resort: first legal
  const first = legal[0]!;
  if (first.type === "bet" || first.type === "raise") {
    return {
      action: {
        type: first.type,
        amountSats: first.minSats,
      },
      message: "house policy: min",
    };
  }
  if (first.type === "call") {
    return {
      action: { type: "call", amountSats: first.amountSats },
      message: "house policy: fallback",
    };
  }
  if (first.type === "all_in") {
    return {
      action: { type: "all_in", amountSats: first.amountSats },
      message: "house policy: fallback",
    };
  }
  return { action: { type: first.type }, message: "house policy: fallback" };
}

function pickBetSize(
  min: number,
  max: number,
  strength: number,
  aggro: number,
  rng: () => number,
): number {
  const t = 0.3 + strength * 0.4 + aggro * 0.2 + rng() * 0.1;
  const raw = min + (max - min) * Math.min(1, t);
  return Math.max(min, Math.min(max, Math.round(raw)));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

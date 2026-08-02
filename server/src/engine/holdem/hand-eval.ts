/**
 * 5–7 card Hold'em evaluation. Higher score wins.
 * Categories: 8 SF … 0 high card.
 */

import { type Card, RANK_VALUE, type Rank } from "./cards.js";

export type HandCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function encodeHand(category: HandCategory, kickers: number[]): number {
  let score = category * 0x100000;
  const k = [...kickers];
  while (k.length < 5) k.push(0);
  for (let i = 0; i < 5; i++) {
    score += (k[i] ?? 0) * 16 ** (4 - i);
  }
  return score;
}

function rankOf(c: Card): number {
  return RANK_VALUE[c[0] as Rank];
}

function suitOf(c: Card): string {
  return c[1]!;
}

/** Highest card of best straight (5 for wheel A-2-3-4-5). */
export function straightHighFromRanks(ranks: number[]): number | null {
  const has = new Set(ranks);
  for (let hi = 14; hi >= 6; hi--) {
    if (
      has.has(hi) &&
      has.has(hi - 1) &&
      has.has(hi - 2) &&
      has.has(hi - 3) &&
      has.has(hi - 4)
    ) {
      return hi;
    }
  }
  // Wheel
  if (has.has(14) && has.has(5) && has.has(4) && has.has(3) && has.has(2)) {
    return 5;
  }
  return null;
}

function evalFive(cards: Card[]): number {
  const ranks = cards.map(rankOf).sort((a, b) => b - a);
  const suits = cards.map(suitOf);
  const isFlush = suits.every((s) => s === suits[0]);
  const sHigh = straightHighFromRanks(ranks);
  const isStraight = sHigh !== null;

  const counts = new Map<number, number>();
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1);
  const byCount = [...counts.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  if (isStraight && isFlush) return encodeHand(8, [sHigh!]);
  if (byCount[0]![1] === 4) {
    const quad = byCount[0]![0];
    const kicker = byCount.find((x) => x[0] !== quad)![0];
    return encodeHand(7, [quad, kicker]);
  }
  if (byCount[0]![1] === 3 && byCount[1]?.[1] === 2) {
    return encodeHand(6, [byCount[0]![0], byCount[1]![0]]);
  }
  if (isFlush) return encodeHand(5, ranks);
  if (isStraight) return encodeHand(4, [sHigh!]);
  if (byCount[0]![1] === 3) {
    const trips = byCount[0]![0];
    const kickers = byCount
      .filter((x) => x[0] !== trips)
      .map((x) => x[0])
      .sort((a, b) => b - a);
    return encodeHand(3, [trips, ...kickers]);
  }
  if (byCount[0]![1] === 2 && byCount[1]?.[1] === 2) {
    const p1 = Math.max(byCount[0]![0], byCount[1]![0]);
    const p2 = Math.min(byCount[0]![0], byCount[1]![0]);
    const kicker = byCount.find((x) => x[1] === 1)![0];
    return encodeHand(2, [p1, p2, kicker]);
  }
  if (byCount[0]![1] === 2) {
    const pair = byCount[0]![0];
    const kickers = byCount
      .filter((x) => x[0] !== pair)
      .map((x) => x[0])
      .sort((a, b) => b - a);
    return encodeHand(1, [pair, ...kickers]);
  }
  return encodeHand(0, ranks);
}

export function evaluateHand(cards: Card[]): number {
  if (cards.length < 5 || cards.length > 7) {
    throw new Error("evaluateHand expects 5–7 cards");
  }
  if (cards.length === 5) return evalFive(cards);
  let best = -1;
  for (const idxs of combinations(cards.length, 5)) {
    const five = idxs.map((i) => cards[i]!);
    const sc = evalFive(five);
    if (sc > best) best = sc;
  }
  return best;
}

function combinations(n: number, k: number): number[][] {
  const out: number[][] = [];
  const cur: number[] = [];
  function rec(start: number) {
    if (cur.length === k) {
      out.push([...cur]);
      return;
    }
    for (let i = start; i < n; i++) {
      cur.push(i);
      rec(i + 1);
      cur.pop();
    }
  }
  rec(0);
  return out;
}

export function compareScores(a: number, b: number): number {
  return a === b ? 0 : a > b ? 1 : -1;
}

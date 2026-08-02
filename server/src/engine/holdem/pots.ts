/**
 * Side pot construction for multiway all-ins.
 *
 * Each contributing seat has contributed `contrib[i]` this hand (total put in pot).
 * Eligible winners are seats that have not folded.
 */

export type Sats = number;

export interface PotSlice {
  /** Amount in this pot */
  amountSats: Sats;
  /** Seats eligible to win this pot (not folded, contributed enough) */
  eligibleSeatIndexes: number[];
}

/**
 * Build main + side pots from per-seat contribution totals.
 * Folded seats still contribute but are not eligible.
 */
export function buildSidePots(
  contrib: Sats[],
  folded: boolean[],
): PotSlice[] {
  if (contrib.length !== folded.length) {
    throw new Error("contrib/folded length mismatch");
  }
  const levels = [
    ...new Set(contrib.filter((c) => c > 0)),
  ].sort((a, b) => a - b);
  if (levels.length === 0) return [];

  const pots: PotSlice[] = [];
  let prev = 0;
  for (const level of levels) {
    const layer = level - prev;
    if (layer <= 0) continue;
    let amount = 0;
    const eligible: number[] = [];
    for (let i = 0; i < contrib.length; i++) {
      if (contrib[i]! >= level) {
        amount += layer;
        if (!folded[i]) eligible.push(i);
      } else if (contrib[i]! > prev) {
        // partial — only contributed part of this layer (shouldn't if levels from set)
        amount += contrib[i]! - prev;
      }
    }
    // Correct multiway: each seat that put in at least `level` pays `layer`
    amount = 0;
    for (let i = 0; i < contrib.length; i++) {
      if (contrib[i]! >= level) {
        amount += layer;
      }
    }
    if (amount > 0 && eligible.length > 0) {
      pots.push({ amountSats: amount, eligibleSeatIndexes: eligible });
    } else if (amount > 0 && eligible.length === 0) {
      // everyone folded into this layer — shouldn't happen mid-hand settle
      pots.push({ amountSats: amount, eligibleSeatIndexes: [] });
    }
    prev = level;
  }
  return pots;
}

/** Split pot among winners (integer sats; remainder to earliest seat index). */
export function splitPot(
  amountSats: Sats,
  winnerSeatIndexes: number[],
): Map<number, Sats> {
  const out = new Map<number, Sats>();
  if (winnerSeatIndexes.length === 0 || amountSats <= 0) return out;
  const n = winnerSeatIndexes.length;
  const base = Math.floor(amountSats / n);
  let rem = amountSats - base * n;
  const sorted = [...winnerSeatIndexes].sort((a, b) => a - b);
  for (const s of sorted) {
    let share = base;
    if (rem > 0) {
      share += 1;
      rem -= 1;
    }
    out.set(s, (out.get(s) ?? 0) + share);
  }
  return out;
}

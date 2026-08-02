/** Standard 52-card deck — rank+suit encoding: "Ah", "Td", "2c". */

export const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "T",
  "J",
  "Q",
  "K",
  "A",
] as const;

export const SUITS = ["c", "d", "h", "s"] as const;

export type Rank = (typeof RANKS)[number];
export type Suit = (typeof SUITS)[number];
export type Card = `${Rank}${Suit}`;

export const RANK_VALUE: Record<Rank, number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export function parseCard(s: string): Card {
  if (s.length !== 2) throw new Error(`bad card: ${s}`);
  const rank = s[0]!.toUpperCase() as Rank;
  const suit = s[1]!.toLowerCase() as Suit;
  if (!RANKS.includes(rank) || !SUITS.includes(suit)) {
    throw new Error(`bad card: ${s}`);
  }
  return `${rank}${suit}`;
}

export function fullDeck(): Card[] {
  const d: Card[] = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      d.push(`${r}${s}`);
    }
  }
  return d;
}

/** Fisher–Yates; optional seed for deterministic tests. */
export function shuffle(deck: Card[], rng: () => number = Math.random): Card[] {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Mulberry32 PRNG from 32-bit seed. */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

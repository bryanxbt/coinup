export type RpsChoice = "rock" | "paper" | "scissors";

export const CHOICES: { id: RpsChoice; label: string; glyph: string }[] = [
  { id: "rock", label: "ROCK", glyph: "✊" },
  { id: "paper", label: "PAPER", glyph: "✋" },
  { id: "scissors", label: "SCISSORS", glyph: "✌" },
];

/** 0 = draw, 1 = a wins, 2 = b wins */
export function roundWinner(a: RpsChoice, b: RpsChoice): 0 | 1 | 2 {
  if (a === b) return 0;
  if (
    (a === "rock" && b === "scissors") ||
    (a === "paper" && b === "rock") ||
    (a === "scissors" && b === "paper")
  ) {
    return 1;
  }
  return 2;
}

export type Seat = {
  id: string;
  name: string;
  sessionId: string;
  joinedAt: number;
};

export type LiveMatch = {
  id: string;
  p1: Seat;
  p2: Seat;
  entrySats: number;
  potSats: number;
  /** waiting_picks | reveal | between | finished */
  phase: "waiting_picks" | "reveal" | "between" | "finished";
  round: number;
  maxRounds: number;
  /** first to this many round wins (best of 3 → 2) */
  winsNeeded: number;
  p1Wins: number;
  p2Wins: number;
  picks: { p1: RpsChoice | null; p2: RpsChoice | null };
  lastRound?: {
    p1: RpsChoice;
    p2: RpsChoice;
    result: 0 | 1 | 2;
  };
  winnerId: string | null;
  createdAt: number;
};

export type LobbyPlayer = {
  id: string;
  name: string;
  sessionId: string;
  joinedAt: number;
  matchId: string | null;
};

export function emptyMatch(
  id: string,
  p1: Seat,
  p2: Seat,
  entrySats: number,
): LiveMatch {
  return {
    id,
    p1,
    p2,
    entrySats,
    potSats: entrySats * 2,
    phase: "waiting_picks",
    round: 1,
    maxRounds: 3,
    winsNeeded: 2,
    p1Wins: 0,
    p2Wins: 0,
    picks: { p1: null, p2: null },
    winnerId: null,
    createdAt: Date.now(),
  };
}

export function applyPick(
  match: LiveMatch,
  playerId: string,
  choice: RpsChoice,
): LiveMatch {
  if (match.phase !== "waiting_picks" || match.winnerId) return match;
  const next = structuredClone(match);
  if (playerId === next.p1.id && !next.picks.p1) next.picks.p1 = choice;
  if (playerId === next.p2.id && !next.picks.p2) next.picks.p2 = choice;

  if (next.picks.p1 && next.picks.p2) {
    const result = roundWinner(next.picks.p1, next.picks.p2);
    next.lastRound = {
      p1: next.picks.p1,
      p2: next.picks.p2,
      result,
    };
    if (result === 1) next.p1Wins += 1;
    if (result === 2) next.p2Wins += 1;
    next.phase = "reveal";

    if (next.p1Wins >= next.winsNeeded) {
      next.winnerId = next.p1.id;
      next.phase = "finished";
    } else if (next.p2Wins >= next.winsNeeded) {
      next.winnerId = next.p2.id;
      next.phase = "finished";
    }
  }
  return next;
}

/** Advance from reveal → next round (host/any client may call once). */
export function advanceAfterReveal(match: LiveMatch): LiveMatch {
  if (match.phase !== "reveal" || match.winnerId) return match;
  const next = structuredClone(match);
  next.round += 1;
  next.picks = { p1: null, p2: null };
  next.phase = "waiting_picks";
  return next;
}

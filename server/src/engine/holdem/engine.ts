/**
 * No-limit Texas Hold'em hand engine (server-authoritative).
 * Amounts for raise/bet are **to-amounts** (total street commitment).
 */

import {
  type Card,
  fullDeck,
  mulberry32,
  shuffle,
} from "./cards.js";
import { evaluateHand } from "./hand-eval.js";
import { buildSidePots, splitPot } from "./pots.js";
import type {
  EngineSnapshot,
  HandConfig,
  HandResult,
  LegalAction,
  PlayerAction,
  SeatState,
  Street,
  Sats,
} from "./types.js";
import { randomUUID } from "node:crypto";

export class EngineError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "EngineError";
  }
}

export class HoldemHand {
  readonly handId: string;
  readonly sbSats: Sats;
  readonly bbSats: Sats;
  readonly buttonSeat: number;
  seats: SeatState[];
  board: Card[] = [];
  street: Street = "preflop";
  /** Highest street bet to match */
  currentBetSats: Sats = 0;
  /** Size of last full raise increment (for min-raise) */
  lastRaiseSizeSats: Sats;
  actionSeat: number | null = null;
  /** Seats that still need to act this street (when facing a bet/check-round) */
  private pending = new Set<number>();
  private deck: Card[] = [];
  private finished = false;
  private result: HandResult | null = null;
  private lastAggressor: number | null = null;

  constructor(
    agents: Array<{ seatNo: number; agentId: string; stackSats: Sats }>,
    config: HandConfig,
  ) {
    if (agents.length < 2 || agents.length > 9) {
      throw new EngineError("bad_seats", "need 2–9 players");
    }
    this.handId = `hand_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    this.sbSats = config.sbSats;
    this.bbSats = config.bbSats;
    this.buttonSeat = config.buttonSeat;
    this.lastRaiseSizeSats = config.bbSats;

    const maxSeat = Math.max(...agents.map((a) => a.seatNo));
    this.seats = [];
    for (let i = 0; i <= maxSeat; i++) {
      const a = agents.find((x) => x.seatNo === i);
      if (a) {
        this.seats.push({
          seatNo: i,
          agentId: a.agentId,
          stackSats: a.stackSats,
          contribSats: 0,
          streetBetSats: 0,
          hole: null,
          hasFolded: false,
          isAllIn: false,
          empty: false,
        });
      } else {
        this.seats.push({
          seatNo: i,
          agentId: "",
          stackSats: 0,
          contribSats: 0,
          streetBetSats: 0,
          hole: null,
          hasFolded: true,
          isAllIn: false,
          empty: true,
        });
      }
    }

    const rng = config.seed !== undefined ? mulberry32(config.seed) : Math.random;
    this.deck = shuffle(fullDeck(), rng);
    this.dealHole();
    this.postBlinds();
    this.beginStreetBetting(true);
  }

  private liveSeats(): SeatState[] {
    return this.seats.filter((s) => !s.empty && !s.hasFolded);
  }

  private canAct(s: SeatState): boolean {
    return !s.empty && !s.hasFolded && !s.isAllIn && s.stackSats > 0;
  }

  private dealHole(): void {
    for (const s of this.seats) {
      if (s.empty) continue;
      const c1 = this.deck.pop()!;
      const c2 = this.deck.pop()!;
      s.hole = [c1, c2];
    }
  }

  private nextOccupied(from: number, pred: (s: SeatState) => boolean): number {
    const n = this.seats.length;
    for (let i = 1; i <= n; i++) {
      const idx = (from + i) % n;
      const s = this.seats[idx]!;
      if (!s.empty && pred(s)) return idx;
    }
    throw new EngineError("no_seat", "no eligible seat");
  }

  private postBlinds(): void {
    const headsUp = this.seats.filter((s) => !s.empty).length === 2;
    // SB = left of button; HU: button posts SB
    const sbSeat = headsUp
      ? this.buttonSeat
      : this.nextOccupied(this.buttonSeat, (s) => !s.empty);
    const bbSeat = this.nextOccupied(sbSeat, (s) => !s.empty);
    this.putBlind(sbSeat, this.sbSats);
    this.putBlind(bbSeat, this.bbSats);
    this.currentBetSats = Math.max(
      this.seats[sbSeat]!.streetBetSats,
      this.seats[bbSeat]!.streetBetSats,
    );
  }

  private putBlind(seatIdx: number, amount: Sats): void {
    const s = this.seats[seatIdx]!;
    const pay = Math.min(amount, s.stackSats);
    s.stackSats -= pay;
    s.streetBetSats += pay;
    s.contribSats += pay;
    if (s.stackSats === 0) s.isAllIn = true;
  }

  private beginStreetBetting(isPreflop: boolean): void {
    this.pending.clear();
    for (const s of this.seats) {
      if (this.canAct(s)) this.pending.add(s.seatNo);
    }
    if (this.pending.size === 0) {
      this.advanceStreet();
      return;
    }

    const headsUp = this.seats.filter((s) => !s.empty).length === 2;
    let first: number;
    if (isPreflop) {
      // UTG = left of BB; HU: button/SB acts first
      const sbSeat = headsUp
        ? this.buttonSeat
        : this.nextOccupied(this.buttonSeat, (s) => !s.empty);
      const bbSeat = this.nextOccupied(sbSeat, (s) => !s.empty);
      first = headsUp
        ? this.buttonSeat
        : this.nextOccupied(bbSeat, (s) => this.canAct(s) || (!s.empty && !s.hasFolded));
      // find first who can act
      first = this.nextOccupied((first - 1 + this.seats.length) % this.seats.length, (s) =>
        this.canAct(s),
      );
    } else {
      // first left of button who can act
      first = this.nextOccupied(this.buttonSeat, (s) => this.canAct(s));
    }
    this.actionSeat = first;
    this.lastAggressor = null;

    // If only one can act and no bet to call, skip
    if (this.shouldSkipBetting()) {
      this.advanceStreet();
    }
  }

  private shouldSkipBetting(): boolean {
    const actors = this.seats.filter((s) => this.canAct(s));
    if (actors.length === 0) return true;
    if (actors.length === 1) {
      const a = actors[0]!;
      return a.streetBetSats >= this.currentBetSats;
    }
    return false;
  }

  potTotal(): Sats {
    return this.seats.reduce((sum, s) => sum + s.contribSats, 0);
  }

  getLegalActions(seatNo?: number): LegalAction[] {
    if (this.finished || this.actionSeat === null) return [];
    const seat = seatNo ?? this.actionSeat;
    if (seat !== this.actionSeat) return [];
    const s = this.seats[seat]!;
    if (!this.canAct(s)) return [];

    const toCall = this.currentBetSats - s.streetBetSats;
    const acts: LegalAction[] = [{ type: "fold" }];

    if (toCall <= 0) {
      acts.push({ type: "check" });
      if (s.stackSats > 0) {
        const minBet = Math.min(this.bbSats, s.stackSats);
        acts.push({
          type: "bet",
          minSats: minBet,
          maxSats: s.stackSats,
        });
        if (s.stackSats > 0) {
          acts.push({ type: "all_in", amountSats: s.stackSats });
        }
      }
    } else {
      if (s.stackSats <= toCall) {
        acts.push({ type: "all_in", amountSats: s.stackSats });
      } else {
        acts.push({ type: "call", amountSats: toCall });
        const minRaiseTo = this.currentBetSats + this.lastRaiseSizeSats;
        const maxRaiseTo = s.streetBetSats + s.stackSats;
        if (maxRaiseTo > this.currentBetSats) {
          if (minRaiseTo <= maxRaiseTo) {
            acts.push({
              type: "raise",
              minSats: minRaiseTo,
              maxSats: maxRaiseTo,
            });
          }
          acts.push({ type: "all_in", amountSats: s.stackSats });
        }
      }
    }
    return acts;
  }

  applyAction(seatNo: number, action: PlayerAction): EngineSnapshot {
    if (this.finished) throw new EngineError("hand_over", "hand finished");
    if (this.actionSeat !== seatNo) {
      throw new EngineError("not_your_turn", `action seat is ${this.actionSeat}`);
    }
    const legal = this.getLegalActions(seatNo);
    this.validateAction(legal, action);
    const s = this.seats[seatNo]!;

    switch (action.type) {
      case "fold":
        s.hasFolded = true;
        this.pending.delete(seatNo);
        break;
      case "check":
        this.pending.delete(seatNo);
        break;
      case "call": {
        const toCall = this.currentBetSats - s.streetBetSats;
        this.putChips(s, toCall);
        this.pending.delete(seatNo);
        break;
      }
      case "bet": {
        const to = action.amountSats!;
        const put = to - s.streetBetSats;
        this.putChips(s, put);
        this.lastRaiseSizeSats = to; // first bet size
        this.currentBetSats = to;
        this.lastAggressor = seatNo;
        this.reopenPending(seatNo);
        this.pending.delete(seatNo);
        break;
      }
      case "raise": {
        const to = action.amountSats!;
        const raiseBy = to - this.currentBetSats;
        const put = to - s.streetBetSats;
        this.putChips(s, put);
        if (raiseBy >= this.lastRaiseSizeSats || s.isAllIn) {
          if (raiseBy >= this.lastRaiseSizeSats) {
            this.lastRaiseSizeSats = raiseBy;
          }
          this.currentBetSats = s.streetBetSats;
          this.lastAggressor = seatNo;
          this.reopenPending(seatNo);
        } else {
          this.currentBetSats = Math.max(this.currentBetSats, s.streetBetSats);
        }
        this.pending.delete(seatNo);
        break;
      }
      case "all_in": {
        const put = s.stackSats;
        const newStreet = s.streetBetSats + put;
        this.putChips(s, put);
        if (newStreet > this.currentBetSats) {
          const raiseBy = newStreet - this.currentBetSats;
          if (raiseBy >= this.lastRaiseSizeSats) {
            this.lastRaiseSizeSats = raiseBy;
            this.lastAggressor = seatNo;
            this.reopenPending(seatNo);
          }
          this.currentBetSats = newStreet;
        }
        this.pending.delete(seatNo);
        break;
      }
      default:
        throw new EngineError("bad_action", "unknown action");
    }

    // Win by fold
    if (this.liveSeats().length === 1) {
      this.finishByFold();
      return this.snapshot();
    }

    this.continueOrAdvance();
    return this.snapshot();
  }

  private validateAction(legal: LegalAction[], action: PlayerAction): void {
    const match = legal.find((l) => l.type === action.type);
    if (!match) {
      throw new EngineError(
        "illegal_action",
        `action ${action.type} not legal; allowed: ${legal.map((l) => l.type).join(",")}`,
      );
    }
    if (action.type === "bet" || action.type === "raise") {
      const m = match as { minSats: Sats; maxSats: Sats };
      const amt = action.amountSats;
      if (amt === undefined || amt < m.minSats || amt > m.maxSats) {
        throw new EngineError(
          "bad_amount",
          `amount must be ${m.minSats}–${m.maxSats} (to-amount)`,
        );
      }
    }
  }

  private putChips(s: SeatState, amount: Sats): void {
    const pay = Math.min(amount, s.stackSats);
    s.stackSats -= pay;
    s.streetBetSats += pay;
    s.contribSats += pay;
    if (s.stackSats === 0) s.isAllIn = true;
  }

  private reopenPending(aggressor: number): void {
    for (const s of this.seats) {
      if (this.canAct(s) && s.seatNo !== aggressor) {
        this.pending.add(s.seatNo);
      }
    }
  }

  private continueOrAdvance(): void {
    // Next actor who is pending and can act, matching bets
    const needAction = [...this.pending].filter((seatNo) => {
      const s = this.seats[seatNo]!;
      return this.canAct(s);
    });

    if (needAction.length === 0) {
      // also check unmatched bets
      const unmatched = this.seats.filter(
        (s) =>
          this.canAct(s) && s.streetBetSats < this.currentBetSats,
      );
      if (unmatched.length > 0) {
        this.actionSeat = unmatched[0]!.seatNo;
        return;
      }
      this.advanceStreet();
      return;
    }

    // next seat after current in table order among needAction
    const cur = this.actionSeat ?? 0;
    let next: number | null = null;
    for (let i = 1; i <= this.seats.length; i++) {
      const idx = (cur + i) % this.seats.length;
      if (needAction.includes(idx)) {
        next = idx;
        break;
      }
    }
    this.actionSeat = next;
    if (this.actionSeat === null) this.advanceStreet();
  }

  private advanceStreet(): void {
    // reset street bets
    for (const s of this.seats) {
      s.streetBetSats = 0;
    }
    this.currentBetSats = 0;
    this.lastRaiseSizeSats = this.bbSats;
    this.actionSeat = null;

    if (this.street === "preflop") {
      this.board.push(this.deck.pop()!, this.deck.pop()!, this.deck.pop()!);
      this.street = "flop";
    } else if (this.street === "flop") {
      this.board.push(this.deck.pop()!);
      this.street = "turn";
    } else if (this.street === "turn") {
      this.board.push(this.deck.pop()!);
      this.street = "river";
    } else if (this.street === "river") {
      this.street = "showdown";
      this.finishShowdown();
      return;
    }

    // if ≤1 player can act, run out board
    const actors = this.seats.filter((s) => this.canAct(s));
    const live = this.liveSeats();
    if (live.length <= 1) {
      this.finishByFold();
      return;
    }
    if (actors.length <= 1) {
      this.runOutBoard();
      this.finishShowdown();
      return;
    }
    this.beginStreetBetting(false);
  }

  private runOutBoard(): void {
    while (this.board.length < 5) {
      this.board.push(this.deck.pop()!);
    }
    this.street = "showdown";
  }

  private finishByFold(): void {
    const winner = this.liveSeats()[0]!;
    const pot = this.potTotal();
    for (const s of this.seats) {
      if (!s.empty) {
        /* contrib already in pot accounting via stacks */
      }
    }
    winner.stackSats += pot;
    // zero contrib tracking for result display
    this.result = {
      pots: [
        {
          amountSats: pot,
          winners: [
            {
              seatNo: winner.seatNo,
              amountSats: pot,
              agentId: winner.agentId,
            },
          ],
        },
      ],
      board: [...this.board],
      showdown: [],
    };
    // clear pot from contrib (already assigned to stack)
    for (const s of this.seats) s.contribSats = 0;
    this.finished = true;
    this.actionSeat = null;
    this.street = "showdown";
  }

  private finishShowdown(): void {
    this.runOutBoard();
    const contrib = this.seats.map((s) => (s.empty ? 0 : s.contribSats));
    const folded = this.seats.map((s) => s.empty || s.hasFolded);
    const pots = buildSidePots(contrib, folded);

    const scores = this.seats.map((s) => {
      if (s.empty || s.hasFolded || !s.hole) return -1;
      return evaluateHand([...s.hole, ...this.board]);
    });

    const potResults: HandResult["pots"] = [];
    const payouts = new Map<number, Sats>();

    for (const pot of pots) {
      if (pot.eligibleSeatIndexes.length === 0) continue;
      let best = -1;
      for (const i of pot.eligibleSeatIndexes) {
        if (scores[i]! > best) best = scores[i]!;
      }
      const winners = pot.eligibleSeatIndexes.filter((i) => scores[i] === best);
      const shares = splitPot(pot.amountSats, winners);
      const winnersOut: HandResult["pots"][0]["winners"] = [];
      for (const [seat, amt] of shares) {
        payouts.set(seat, (payouts.get(seat) ?? 0) + amt);
        winnersOut.push({
          seatNo: seat,
          amountSats: amt,
          agentId: this.seats[seat]!.agentId,
        });
      }
      potResults.push({ amountSats: pot.amountSats, winners: winnersOut });
    }

    for (const [seat, amt] of payouts) {
      this.seats[seat]!.stackSats += amt;
    }
    for (const s of this.seats) s.contribSats = 0;

    this.result = {
      pots: potResults,
      board: [...this.board],
      showdown: this.seats
        .filter((s) => !s.empty && !s.hasFolded && s.hole)
        .map((s) => ({
          seatNo: s.seatNo,
          agentId: s.agentId,
          hole: s.hole!,
          score: scores[s.seatNo]!,
        })),
    };
    this.finished = true;
    this.actionSeat = null;
  }

  snapshot(forSeat?: number): EngineSnapshot {
    return {
      handId: this.handId,
      street: this.street,
      board: [...this.board],
      potSats: this.potTotal(),
      sbSats: this.sbSats,
      bbSats: this.bbSats,
      buttonSeat: this.buttonSeat,
      actionSeat: this.actionSeat,
      currentBetSats: this.currentBetSats,
      minRaiseToSats:
        this.currentBetSats > 0
          ? this.currentBetSats + this.lastRaiseSizeSats
          : this.bbSats,
      seats: this.seats.map((s) => ({
        seatNo: s.seatNo,
        agentId: s.empty ? null : s.agentId,
        stackSats: s.stackSats,
        streetBetSats: s.streetBetSats,
        contribSats: s.contribSats,
        hasFolded: s.hasFolded,
        isAllIn: s.isAllIn,
        empty: s.empty,
      })),
      legalActions:
        forSeat !== undefined && forSeat === this.actionSeat
          ? this.getLegalActions(forSeat)
          : this.actionSeat !== null
            ? this.getLegalActions(this.actionSeat)
            : null,
      finished: this.finished,
      result: this.result,
    };
  }

  /** Hole cards for one seat only */
  getHole(seatNo: number): [Card, Card] | null {
    const s = this.seats[seatNo];
    return s && !s.empty ? s.hole : null;
  }
}

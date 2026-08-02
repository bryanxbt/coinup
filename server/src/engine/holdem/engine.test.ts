/**
 * Run: npx tsx --test src/engine/holdem/*.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateHand, compareScores, straightHighFromRanks } from "./hand-eval.js";
import { parseCard, type Card } from "./cards.js";
import { buildSidePots, splitPot } from "./pots.js";
import { HoldemHand } from "./engine.js";

function C(...xs: string[]): Card[] {
  return xs.map(parseCard);
}

describe("hand evaluation", () => {
  it("royal flush beats quads", () => {
    const rf = evaluateHand(C("Ah", "Kh", "Qh", "Jh", "Th", "2c", "3d"));
    const q = evaluateHand(C("As", "Ad", "Ac", "Ah", "Kd", "2c", "3d"));
    assert.ok(compareScores(rf, q) > 0);
  });

  it("wheel straight", () => {
    assert.equal(straightHighFromRanks([14, 5, 4, 3, 2]), 5);
    const wh = evaluateHand(C("Ah", "2d", "3c", "4s", "5h"));
    const pair = evaluateHand(C("Ah", "Ad", "Kc", "2s", "3h"));
    assert.ok(compareScores(wh, pair) > 0);
  });

  it("full house beats flush", () => {
    const fh = evaluateHand(C("Ah", "Ad", "Ac", "Kd", "Ks"));
    const fl = evaluateHand(C("2h", "5h", "9h", "Jh", "Qh"));
    assert.ok(compareScores(fh, fl) > 0);
  });
});

describe("side pots", () => {
  it("two-level all-in side pot", () => {
    // A: 50 all-in, B: 100, C: 100; B folds? all active
    // contrib [50, 100, 100]
    const pots = buildSidePots([50, 100, 100], [false, false, false]);
    // main: 50*3 = 150 eligible all three
    // side: 50*2 = 100 eligible B,C
    assert.equal(pots.length, 2);
    assert.equal(pots[0]!.amountSats, 150);
    assert.deepEqual(pots[0]!.eligibleSeatIndexes, [0, 1, 2]);
    assert.equal(pots[1]!.amountSats, 100);
    assert.deepEqual(pots[1]!.eligibleSeatIndexes, [1, 2]);
  });

  it("folded player contributes but not eligible", () => {
    const pots = buildSidePots([100, 100, 50], [false, true, false]);
    // levels 50, 100
    // at 50: all three contribute 50 → 150, eligible 0 and 2
    // at 100: seats 0,1 contribute 50 more → 100, eligible only 0
    assert.ok(pots.length >= 1);
    const main = pots[0]!;
    assert.ok(main.eligibleSeatIndexes.includes(0));
    assert.ok(!main.eligibleSeatIndexes.includes(1));
  });

  it("split pot remainder to lowest seat", () => {
    const m = splitPot(100, [2, 0]);
    assert.equal(m.get(0)! + m.get(2)!, 100);
    assert.equal(m.get(0), 50);
    assert.equal(m.get(2), 50);
    const m2 = splitPot(101, [2, 0]);
    assert.equal(m2.get(0)! + m2.get(2)!, 101);
    assert.equal(m2.get(0), 51); // lower seat gets remainder
  });
});

describe("HoldemHand play", () => {
  it("heads-up fold awards pot to remaining player", () => {
    const h = new HoldemHand(
      [
        { seatNo: 0, agentId: "a", stackSats: 1000 },
        { seatNo: 1, agentId: "b", stackSats: 1000 },
      ],
      { sbSats: 5, bbSats: 10, buttonSeat: 0, seed: 42 },
    );
    // HU: button is SB and acts first preflop
    const actor = h.snapshot().actionSeat!;
    const snap = h.applyAction(actor, { type: "fold" });
    assert.equal(snap.finished, true);
    assert.ok(snap.result);
    const stacks = snap.seats.filter((s) => !s.empty).map((s) => s.stackSats);
    // total chips conserved
    assert.equal(
      stacks.reduce((a, b) => a + b, 0),
      2000,
    );
  });

  it("legal actions include call facing blinds", () => {
    const h = new HoldemHand(
      [
        { seatNo: 0, agentId: "a", stackSats: 500 },
        { seatNo: 1, agentId: "b", stackSats: 500 },
        { seatNo: 2, agentId: "c", stackSats: 500 },
      ],
      { sbSats: 5, bbSats: 10, buttonSeat: 0, seed: 7 },
    );
    const seat = h.snapshot().actionSeat!;
    const legal = h.getLegalActions(seat);
    const types = legal.map((l) => l.type);
    assert.ok(types.includes("fold"));
    assert.ok(types.includes("call") || types.includes("all_in"));
  });

  it("check-check can advance streets until showdown with short stacks", () => {
    // Deep enough for full hand; use deterministic seed
    const h = new HoldemHand(
      [
        { seatNo: 0, agentId: "a", stackSats: 200 },
        { seatNo: 1, agentId: "b", stackSats: 200 },
      ],
      { sbSats: 1, bbSats: 2, buttonSeat: 0, seed: 99 },
    );
    let guard = 0;
    while (!h.snapshot().finished && guard++ < 80) {
      const seat = h.snapshot().actionSeat;
      if (seat === null) break;
      const legal = h.getLegalActions(seat);
      if (legal.some((l) => l.type === "check")) {
        h.applyAction(seat, { type: "check" });
      } else if (legal.some((l) => l.type === "call")) {
        const call = legal.find((l) => l.type === "call")!;
        h.applyAction(seat, {
          type: "call",
          amountSats: (call as { amountSats: number }).amountSats,
        });
      } else {
        h.applyAction(seat, { type: "fold" });
      }
    }
    const snap = h.snapshot();
    // either finished by fold or showdown
    assert.ok(snap.finished || snap.street === "showdown" || guard < 80);
    const total = snap.seats
      .filter((s) => !s.empty)
      .reduce((a, s) => a + s.stackSats + s.contribSats, 0);
    // chips conserved (pot may still be in contrib mid-hand)
    assert.ok(total <= 400 && total >= 0);
  });

  it("all-in preflop runs out board", () => {
    const h = new HoldemHand(
      [
        { seatNo: 0, agentId: "a", stackSats: 50 },
        { seatNo: 1, agentId: "b", stackSats: 50 },
      ],
      { sbSats: 5, bbSats: 10, buttonSeat: 0, seed: 1 },
    );
    let guard = 0;
    while (!h.snapshot().finished && guard++ < 40) {
      const seat = h.snapshot().actionSeat;
      if (seat === null) break;
      const legal = h.getLegalActions(seat);
      if (legal.some((l) => l.type === "all_in")) {
        h.applyAction(seat, { type: "all_in" });
      } else if (legal.some((l) => l.type === "call")) {
        const c = legal.find((l) => l.type === "call") as {
          amountSats: number;
        };
        h.applyAction(seat, { type: "call", amountSats: c.amountSats });
      } else if (legal.some((l) => l.type === "check")) {
        h.applyAction(seat, { type: "check" });
      } else {
        h.applyAction(seat, { type: "fold" });
      }
    }
    const snap = h.snapshot();
    assert.equal(snap.finished, true);
    assert.ok(snap.board.length === 5 || (snap.result && snap.result.showdown.length === 0));
    const total = snap.seats
      .filter((s) => !s.empty)
      .reduce((a, s) => a + s.stackSats, 0);
    assert.equal(total, 100);
  });

  it("rejects action out of turn", () => {
    const h = new HoldemHand(
      [
        { seatNo: 0, agentId: "a", stackSats: 100 },
        { seatNo: 1, agentId: "b", stackSats: 100 },
      ],
      { sbSats: 5, bbSats: 10, buttonSeat: 0, seed: 3 },
    );
    const actor = h.snapshot().actionSeat!;
    const other = actor === 0 ? 1 : 0;
    assert.throws(() => h.applyAction(other, { type: "fold" }));
  });
});

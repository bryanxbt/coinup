import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chooseGuidedAction, holeStrength } from "./policy.js";
import type { LegalAction } from "../engine/holdem/types.js";

function pending(
  legal: LegalAction[],
  hole: [string, string] | null,
  call = 0,
) {
  return {
    agentId: "agt_x",
    tableId: "tbl_x",
    handId: "hand_x",
    seq: 1,
    street: "preflop",
    legalActions: legal,
    callAmountSats: call,
    privateHole: hole,
    publicState: { potSats: 150, board: [] as string[], currentBetSats: call },
  };
}

describe("guided policy", () => {
  it("hole strength ranks AA above 72o", () => {
    assert.ok(
      holeStrength(["Ah", "As"])! > holeStrength(["7h", "2c"])!,
    );
  });

  it("checks when check is free", () => {
    const { action } = chooseGuidedAction(
      { tightness: 50, aggression: 20, bluffFrequency: 0, preferredGames: [] },
      pending(
        [{ type: "fold" }, { type: "check" }, { type: "bet", minSats: 10, maxSats: 100 }],
        ["2c", "7d"],
      ),
      1,
    );
    assert.ok(action.type === "check" || action.type === "bet");
  });

  it("only returns legal types", () => {
    const legal: LegalAction[] = [
      { type: "fold" },
      { type: "call", amountSats: 50 },
      { type: "raise", minSats: 200, maxSats: 1000 },
    ];
    for (let i = 0; i < 20; i++) {
      const { action } = chooseGuidedAction(
        {
          tightness: (i * 17) % 100,
          aggression: (i * 23) % 100,
          bluffFrequency: (i * 11) % 100,
          preferredGames: ["texas-holdem"],
        },
        pending(legal, i % 2 === 0 ? ["Ah", "Kh"] : ["3c", "8d"], 50),
        i,
      );
      assert.ok(
        legal.some((l) => l.type === action.type),
        `illegal ${action.type}`,
      );
    }
  });

  it("tight agent folds junk more often facing bet", () => {
    const legal: LegalAction[] = [
      { type: "fold" },
      { type: "call", amountSats: 100 },
    ];
    let folds = 0;
    for (let i = 0; i < 30; i++) {
      const { action } = chooseGuidedAction(
        {
          tightness: 90,
          aggression: 10,
          bluffFrequency: 0,
          preferredGames: [],
        },
        pending(legal, ["2c", "7d"], 100),
        i + 100,
      );
      if (action.type === "fold") folds++;
    }
    assert.ok(folds >= 15, `expected mostly folds, got ${folds}/30`);
  });
});

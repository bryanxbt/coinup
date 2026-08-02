import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  commitHandStart,
  getHistory,
  listHistory,
  recordHandEnd,
  resetHistoryForTests,
  verifyCommit,
} from "./store.js";

describe("hand history commit-reveal", () => {
  beforeEach(() => resetHistoryForTests());

  it("commit matches reveal", () => {
    const handId = "hand_test1";
    const seed = 42;
    const { seedCommit } = commitHandStart({
      tableId: "tbl_1",
      tableName: "Felt",
      handNumber: 1,
      handId,
      seed,
      stacks: [
        { agentId: "a", stackSats: 1000 },
        { agentId: "b", stackSats: 1000 },
      ],
    });
    assert.equal(seedCommit.length, 64);

    const entry = recordHandEnd({
      handId,
      board: ["Ah", "Kd", "2c", "7s", "9h"],
      potSats: 200,
      streetEnded: "showdown",
      seats: [
        { seatNo: 0, agentId: "a", stackSats: 1200, hasFolded: false },
        { seatNo: 1, agentId: "b", stackSats: 800, hasFolded: true },
      ],
      result: { pots: [] },
    });
    assert.ok(entry);
    assert.equal(entry!.seedReveal, 42);
    assert.equal(verifyCommit(entry!), true);
    assert.equal(listHistory().length, 1);
    assert.ok(getHistory(entry!.id));
    assert.ok(getHistory(handId));
  });
});

/**
 * Run: npx tsx --test src/ledger/service.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createMemoryStore } from "./memory-store.js";
import { createLedgerService } from "./service.js";
import { LedgerError } from "./sats.js";

function svc() {
  return createLedgerService(createMemoryStore(), "mock");
}

describe("LedgerService", () => {
  it("faucet then balance", () => {
    const ledger = svc();
    const r = ledger.apply({
      kind: "faucet",
      playerId: "p1",
      amountSats: 100_000,
      idempotencyKey: "k-faucet-1",
    });
    assert.equal(r.balance.availableSats, 100_000);
    assert.equal(r.balance.lockedSats, 0);
  });

  it("double buy-in with same key is one debit", () => {
    const ledger = svc();
    ledger.apply({
      kind: "faucet",
      playerId: "p1",
      amountSats: 50_000,
      idempotencyKey: "k-f",
    });
    const a = ledger.apply({
      kind: "buy_in",
      playerId: "p1",
      tableId: "t1",
      agentId: "a1",
      amountSats: 10_000,
      idempotencyKey: "k-buy",
    });
    const b = ledger.apply({
      kind: "buy_in",
      playerId: "p1",
      tableId: "t1",
      agentId: "a1",
      amountSats: 10_000,
      idempotencyKey: "k-buy",
    });
    assert.equal(a.txRef, b.txRef);
    assert.equal(b.balance.availableSats, 40_000);
    assert.equal(b.balance.lockedSats, 10_000);
    assert.equal(b.balance.lockedDetail?.tableSats, 10_000);
  });

  it("same key different body → 409", () => {
    const ledger = svc();
    ledger.apply({
      kind: "faucet",
      playerId: "p1",
      amountSats: 50_000,
      idempotencyKey: "k-f2",
    });
    ledger.apply({
      kind: "buy_in",
      playerId: "p1",
      tableId: "t1",
      agentId: "a1",
      amountSats: 5_000,
      idempotencyKey: "k-same",
    });
    assert.throws(
      () =>
        ledger.apply({
          kind: "buy_in",
          playerId: "p1",
          tableId: "t1",
          agentId: "a1",
          amountSats: 9_000,
          idempotencyKey: "k-same",
        }),
      (e: unknown) =>
        e instanceof LedgerError && e.code === "idempotency_conflict",
    );
  });

  it("missing idempotency key → 400", () => {
    const ledger = svc();
    assert.throws(
      () =>
        ledger.apply({
          kind: "faucet",
          playerId: "p1",
          amountSats: 1,
          idempotencyKey: "",
        }),
      (e: unknown) =>
        e instanceof LedgerError && e.code === "missing_idempotency_key",
    );
  });

  it("buy-in then cash-out restores available", () => {
    const ledger = svc();
    ledger.apply({
      kind: "faucet",
      playerId: "p1",
      amountSats: 20_000,
      idempotencyKey: "f",
    });
    ledger.apply({
      kind: "buy_in",
      playerId: "p1",
      tableId: "t1",
      agentId: "a1",
      amountSats: 8_000,
      idempotencyKey: "b",
    });
    const out = ledger.apply({
      kind: "cash_out_table",
      playerId: "p1",
      tableId: "t1",
      agentId: "a1",
      amountSats: 8_000,
      idempotencyKey: "c",
    });
    assert.equal(out.balance.availableSats, 20_000);
    assert.equal(out.balance.lockedSats, 0);
  });

  it("insufficient funds on buy-in", () => {
    const ledger = svc();
    ledger.apply({
      kind: "faucet",
      playerId: "p1",
      amountSats: 100,
      idempotencyKey: "f",
    });
    assert.throws(
      () =>
        ledger.apply({
          kind: "buy_in",
          playerId: "p1",
          tableId: "t1",
          agentId: "a1",
          amountSats: 200,
          idempotencyKey: "b",
        }),
      (e: unknown) =>
        e instanceof LedgerError && e.code === "insufficient_available",
    );
  });

  it("rejects non-integer sats", () => {
    const ledger = svc();
    assert.throws(
      () =>
        ledger.apply({
          kind: "faucet",
          playerId: "p1",
          amountSats: 1.5 as number,
          idempotencyKey: "f",
        }),
      (e: unknown) => e instanceof LedgerError && e.code === "invalid_sats",
    );
  });

  it("tournament entry locks tournament bucket", () => {
    const ledger = svc();
    ledger.apply({
      kind: "faucet",
      playerId: "p1",
      amountSats: 30_000,
      idempotencyKey: "f",
    });
    const r = ledger.apply({
      kind: "tournament_entry",
      playerId: "p1",
      tournamentId: "sng-1",
      agentId: "a1",
      amountSats: 5_000,
      idempotencyKey: "t",
    });
    assert.equal(r.balance.availableSats, 25_000);
    assert.equal(r.balance.lockedDetail?.tournamentSats, 5_000);
  });
});

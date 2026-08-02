/**
 * Run: npx tsx --test src/auth/session.test.ts
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createGuestSession,
  getSession,
  linkWallet,
  revokeSession,
} from "./session-store.js";

describe("auth sessions", () => {
  it("creates guest session and resolves bearer", () => {
    const s = createGuestSession("player_testabc");
    assert.equal(s.kind, "guest");
    assert.equal(s.playerId, "player_testabc");
    const got = getSession(s.token);
    assert.ok(got);
    assert.equal(got!.playerId, "player_testabc");
  });

  it("rejects missing token", () => {
    assert.equal(getSession(null), null);
    assert.equal(getSession("cr_bogus"), null);
  });

  it("revokes session", () => {
    const s = createGuestSession();
    assert.ok(getSession(s.token));
    assert.equal(revokeSession(s.token), true);
    assert.equal(getSession(s.token), null);
  });

  it("upgrades to wallet-linked", () => {
    const s = createGuestSession("player_wallet1");
    const linked = linkWallet(s.token, {
      pubkey: "bc1qtestpubkeyxx",
      signature: "sig",
      message: "coinup:link:player_wallet1:1",
    });
    assert.equal(linked.kind, "wallet");
    assert.equal(linked.walletPubkey, "bc1qtestpubkeyxx");
  });
});

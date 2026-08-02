import { Hono } from "hono";
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { LedgerError } from "./sats.js";
import { createLedgerService } from "./service.js";
import type { LedgerOp, LedgerOpKind } from "./types.js";
import { config } from "../config.js";
import { requireSession, requireWallet } from "../auth/middleware.js";
import type { Session } from "../auth/session-store.js";

const ledger = createLedgerService(undefined, config.paymentsMode as "mock");

type Body = Record<string, unknown>;

function optionalString(body: Body, key: string): string | undefined {
  const v = body[key];
  if (v === undefined || v === null) return undefined;
  if (typeof v !== "string") {
    throw new LedgerError("invalid_request", 400, `${key} must be string`);
  }
  return v;
}

function requireNumber(body: Body, key: string): number {
  const v = body[key];
  if (typeof v !== "number") {
    throw new LedgerError("invalid_request", 400, `${key} required number`);
  }
  return v;
}

function requireString(body: Body, key: string): string {
  const v = body[key];
  if (typeof v !== "string" || !v) {
    throw new LedgerError("invalid_request", 400, `${key} required`);
  }
  return v;
}

function mapError(err: unknown): {
  status: ContentfulStatusCode;
  body: Record<string, unknown>;
} {
  if (err instanceof LedgerError) {
    return {
      status: err.status as ContentfulStatusCode,
      body: {
        error: err.code,
        message: err.message,
        ...err.extra,
      },
    };
  }
  console.error("[ledger]", err);
  return {
    status: 500,
    body: { error: "internal", message: "ledger error" },
  };
}

function sessionOf(c: Context): Session {
  return c.get("session") as Session;
}

/**
 * Money ops always use the session playerId — body playerId if present must match.
 */
function applyKind(kind: LedgerOpKind) {
  return async (c: Context) => {
    try {
      const session = sessionOf(c);
      const body = (await c.req.json()) as Body;
      if (
        typeof body.playerId === "string" &&
        body.playerId &&
        body.playerId !== session.playerId
      ) {
        throw new LedgerError(
          "player_mismatch",
          403,
          "playerId does not match session",
        );
      }
      const op: LedgerOp = {
        kind,
        playerId: session.playerId,
        idempotencyKey: requireString(body, "idempotencyKey"),
        amountSats:
          body.amountSats !== undefined
            ? requireNumber(body, "amountSats")
            : undefined,
        agentId: optionalString(body, "agentId"),
        tableId: optionalString(body, "tableId"),
        tournamentId: optionalString(body, "tournamentId"),
        refType: optionalString(body, "refType"),
        refId: optionalString(body, "refId"),
        reason: optionalString(body, "reason"),
        termsId: optionalString(body, "termsId"),
        positionId: optionalString(body, "positionId"),
      };
      const result = ledger.apply(op);
      return c.json(result);
    } catch (err) {
      const { status, body } = mapError(err);
      return c.json(body, status);
    }
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountLedgerRoutes(app: Hono<any>): void {
  // Balance: own account only (auth required)
  app.get("/v1/ledger/balance", requireSession, (c) => {
    try {
      const session = sessionOf(c);
      return c.json(ledger.getBalance(session.playerId));
    } catch (err) {
      const { status, body } = mapError(err);
      return c.json(body, status);
    }
  });

  // Legacy path — only if playerId matches session
  app.get("/v1/ledger/balance/:playerId", requireSession, (c) => {
    try {
      const session = sessionOf(c);
      const playerId = c.req.param("playerId");
      if (playerId !== session.playerId) {
        return c.json(
          { error: "forbidden", message: "cannot read another player's balance" },
          403,
        );
      }
      return c.json(ledger.getBalance(playerId));
    } catch (err) {
      const { status, body } = mapError(err);
      return c.json(body, status);
    }
  });

  app.get("/v1/ledger/entries", requireSession, (c) => {
    try {
      const session = sessionOf(c);
      const limit = Number(c.req.query("limit") ?? 50);
      return c.json({ entries: ledger.listEntries(session.playerId, limit) });
    } catch (err) {
      const { status, body } = mapError(err);
      return c.json(body, status);
    }
  });

  app.get("/v1/ledger/entries/:playerId", requireSession, (c) => {
    try {
      const session = sessionOf(c);
      const playerId = c.req.param("playerId");
      if (playerId !== session.playerId) {
        return c.json(
          { error: "forbidden", message: "cannot read another player's entries" },
          403,
        );
      }
      const limit = Number(c.req.query("limit") ?? 50);
      return c.json({ entries: ledger.listEntries(playerId, limit) });
    } catch (err) {
      const { status, body } = mapError(err);
      return c.json(body, status);
    }
  });

  // Mock faucet — guest OK when PAYMENTS_MODE=mock
  app.post("/v1/ledger/faucet", requireSession, async (c) => {
    if (config.paymentsMode !== "mock") {
      return c.json(
        { error: "faucet_disabled", message: "faucet only in mock mode" },
        403,
      );
    }
    return applyKind("faucet")(c);
  });

  app.post("/v1/ledger/deposit", requireSession, applyKind("deposit"));

  // Withdraw-to-BTC path: wallet bind required (mock still gates for hygiene)
  app.post(
    "/v1/ledger/withdraw",
    requireSession,
    requireWallet,
    applyKind("withdraw"),
  );

  app.post("/v1/ledger/buy-in", requireSession, applyKind("buy_in"));
  app.post("/v1/ledger/cash-out", requireSession, applyKind("cash_out_table"));
  app.post(
    "/v1/ledger/tournament-entry",
    requireSession,
    applyKind("tournament_entry"),
  );
  app.post("/v1/ledger/refund", requireSession, applyKind("refund_entry"));
  app.post("/v1/ledger/backing/lock", requireSession, applyKind("lock_backing"));
  app.post(
    "/v1/ledger/backing/release",
    requireSession,
    applyKind("release_backing"),
  );
}

export { ledger };

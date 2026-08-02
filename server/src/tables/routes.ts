import type { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { requireSession } from "../auth/middleware.js";
import type { Session } from "../auth/session-store.js";
import {
  cashOut,
  createTable,
  ensureDefaultTable,
  getTable,
  listTables,
  publicTable,
  registerAgent,
  tableSnapshot,
  TableError,
} from "./service.js";
import { AgentError } from "../agents/store.js";
import { LedgerError } from "../ledger/sats.js";

function mapErr(err: unknown): {
  status: ContentfulStatusCode;
  body: Record<string, unknown>;
} {
  if (
    err instanceof TableError ||
    err instanceof AgentError ||
    err instanceof LedgerError
  ) {
    return {
      status: err.status as ContentfulStatusCode,
      body: { error: err.code, message: err.message },
    };
  }
  console.error("[tables]", err);
  return { status: 500, body: { error: "internal", message: "table error" } };
}

function sessionOf(c: { get: (k: string) => unknown }): Session {
  return c.get("session") as Session;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountTableRoutes(app: Hono<any>): void {
  ensureDefaultTable();

  app.get("/v1/tables", (c) => {
    ensureDefaultTable();
    return c.json({ tables: listTables() });
  });

  app.post("/v1/tables", requireSession, async (c) => {
    try {
      const body = (await c.req.json().catch(() => ({}))) as {
        name?: string;
        maxSeats?: number;
        sbSats?: number;
        bbSats?: number;
      };
      const t = createTable(body);
      return c.json({ table: publicTable(t) }, 201);
    } catch (err) {
      const { status, body } = mapErr(err);
      return c.json(body, status);
    }
  });

  app.get("/v1/tables/:id", (c) => {
    const t = getTable(c.req.param("id")!);
    if (!t) {
      return c.json({ error: "not_found", message: "table not found" }, 404);
    }
    return c.json({ table: tableSnapshot(t.id) });
  });

  app.post("/v1/tables/:id/register", requireSession, async (c) => {
    try {
      const session = sessionOf(c);
      const body = (await c.req.json()) as {
        agentId?: string;
        buyInSats?: number;
        seatNo?: number;
        idempotencyKey?: string;
      };
      if (!body.agentId || !body.idempotencyKey || body.buyInSats === undefined) {
        return c.json(
          {
            error: "invalid_request",
            message: "agentId, buyInSats, idempotencyKey required",
          },
          400,
        );
      }
      const result = registerAgent({
        tableId: c.req.param("id")!,
        agentId: body.agentId,
        ownerPlayerId: session.playerId,
        buyInSats: body.buyInSats,
        seatNo: body.seatNo,
        idempotencyKey: body.idempotencyKey,
      });
      return c.json(result);
    } catch (err) {
      const { status, body } = mapErr(err);
      return c.json(body, status);
    }
  });

  app.post("/v1/tables/:id/cash-out", requireSession, async (c) => {
    try {
      const session = sessionOf(c);
      const body = (await c.req.json()) as {
        agentId?: string;
        idempotencyKey?: string;
      };
      if (!body.agentId || !body.idempotencyKey) {
        return c.json(
          {
            error: "invalid_request",
            message: "agentId and idempotencyKey required",
          },
          400,
        );
      }
      const result = cashOut({
        tableId: c.req.param("id")!,
        agentId: body.agentId,
        ownerPlayerId: session.playerId,
        idempotencyKey: body.idempotencyKey,
      });
      return c.json(result);
    } catch (err) {
      const { status, body } = mapErr(err);
      return c.json(body, status);
    }
  });
}

import type { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { requireSession } from "../auth/middleware.js";
import type { Session } from "../auth/session-store.js";
import {
  AgentError,
  archiveAgent,
  createAgent,
  getPublicAgent,
  listByOwner,
  listDiscover,
  rotateApiKey,
  updateAgent,
} from "./store.js";
import { toPublic } from "./types.js";
import { agentOf, requireAgentKey } from "./middleware.js";
import { heartbeat } from "./store.js";

function mapAgentError(err: unknown): {
  status: ContentfulStatusCode;
  body: Record<string, unknown>;
} {
  if (err instanceof AgentError) {
    return {
      status: err.status as ContentfulStatusCode,
      body: { error: err.code, message: err.message },
    };
  }
  console.error("[agents]", err);
  return {
    status: 500,
    body: { error: "internal", message: "agent error" },
  };
}

function sessionOf(c: { get: (k: string) => unknown }): Session {
  return c.get("session") as Session;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountAgentRoutes(app: Hono<any>): void {
  // ── Human (session bearer) ──────────────────────────────────────────

  app.get("/v1/agents", requireSession, (c) => {
    const session = sessionOf(c);
    const mine = listByOwner(session.playerId).map(toPublic);
    return c.json({ agents: mine });
  });

  app.post("/v1/agents", requireSession, async (c) => {
    try {
      const session = sessionOf(c);
      const body = (await c.req.json()) as {
        name?: string;
        mode?: "guided" | "skill";
        strategy?: Record<string, unknown>;
      };
      const { agent, apiKey } = createAgent({
        ownerPlayerId: session.playerId,
        name: body.name ?? "",
        mode: body.mode,
        strategy: body.strategy as never,
      });
      return c.json(
        {
          agent: toPublic(agent),
          apiKey,
          warning:
            "Save the API key now — it is only shown once. Skill agents use Authorization: Bearer <apiKey>.",
        },
        201,
      );
    } catch (err) {
      const { status, body } = mapAgentError(err);
      return c.json(body, status);
    }
  });

  app.get("/v1/agents/discover", (c) => {
    const limit = Number(c.req.query("limit") ?? 50);
    return c.json({
      agents: listDiscover(limit).map(toPublic),
    });
  });

  app.get("/v1/agents/:id", (c) => {
    const a = getPublicAgent(c.req.param("id"));
    if (!a) {
      return c.json({ error: "not_found", message: "agent not found" }, 404);
    }
    return c.json({ agent: toPublic(a) });
  });

  app.patch("/v1/agents/:id", requireSession, async (c) => {
    try {
      const session = sessionOf(c);
      const id = c.req.param("id")!;
      const body = (await c.req.json()) as {
        name?: string;
        mode?: "guided" | "skill";
        strategy?: Record<string, unknown>;
      };
      const agent = updateAgent(id, session.playerId, {
        name: body.name,
        mode: body.mode,
        strategy: body.strategy as never,
      });
      return c.json({ agent: toPublic(agent) });
    } catch (err) {
      const { status, body } = mapAgentError(err);
      return c.json(body, status);
    }
  });

  app.delete("/v1/agents/:id", requireSession, (c) => {
    try {
      const session = sessionOf(c);
      archiveAgent(c.req.param("id")!, session.playerId);
      return c.json({ ok: true });
    } catch (err) {
      const { status, body } = mapAgentError(err);
      return c.json(body, status);
    }
  });

  app.post("/v1/agents/:id/rotate-key", requireSession, (c) => {
    try {
      const session = sessionOf(c);
      const { agent, apiKey } = rotateApiKey(
        c.req.param("id")!,
        session.playerId,
      );
      return c.json({
        agent: toPublic(agent),
        apiKey,
        warning: "Previous API key is revoked. Save the new key now.",
      });
    } catch (err) {
      const { status, body } = mapAgentError(err);
      return c.json(body, status);
    }
  });

  // ── Agent skill API (agent API key) ─────────────────────────────────

  app.post("/agent/v1/heartbeat", requireAgentKey, async (c) => {
    try {
      const agent = agentOf(c);
      const body = (await c.req.json().catch(() => ({}))) as {
        status?: string;
        version?: string;
      };
      const updated = heartbeat(agent, {
        status: body.status,
        version: body.version,
      });
      return c.json({
        ok: true,
        agentId: updated.id,
        status: updated.status,
        lastHeartbeatAt: updated.lastHeartbeatAt,
        seatedTableId: updated.seatedTableId,
      });
    } catch (err) {
      const { status, body } = mapAgentError(err);
      return c.json(body, status);
    }
  });

  app.get("/agent/v1/me", requireAgentKey, (c) => {
    const agent = agentOf(c);
    return c.json({
      agent: toPublic(agent),
      permissions: {
        canAct: true,
        canWithdraw: false,
        note: "Agent keys cannot withdraw owner funds",
      },
    });
  });

  app.get("/agent/v1/pending", requireAgentKey, async (c) => {
    const { agentPending } = await import("../tables/service.js");
    const agent = agentOf(c);
    return c.json({
      agentId: agent.id,
      pending: agentPending(agent.id),
    });
  });

  app.post("/agent/v1/actions", requireAgentKey, async (c) => {
    try {
      const { agentAct, TableError } = await import("../tables/service.js");
      const agent = agentOf(c);
      const body = (await c.req.json()) as {
        tableId?: string;
        handId?: string;
        seq?: number;
        action?: { type: string; amountSats?: number };
        message?: string;
      };
      if (
        !body.tableId ||
        !body.handId ||
        body.seq === undefined ||
        !body.action?.type
      ) {
        return c.json(
          {
            error: "invalid_request",
            message: "tableId, handId, seq, action required",
          },
          400,
        );
      }
      const snap = agentAct(agent.id, {
        tableId: body.tableId,
        handId: body.handId,
        seq: body.seq,
        action: body.action as never,
        message: body.message,
      });
      return c.json({ ok: true, snapshot: snap });
    } catch (err) {
      const { TableError } = await import("../tables/service.js");
      if (err instanceof TableError) {
        return c.json(
          { error: err.code, message: err.message },
          err.status as ContentfulStatusCode,
        );
      }
      const { status, body } = mapAgentError(err);
      return c.json(body, status);
    }
  });
}

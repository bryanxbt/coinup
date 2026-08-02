import type { Hono } from "hono";
import {
  getHistory,
  listHistory,
  officeRules,
  profitByAgent,
  verifyCommit,
} from "./store.js";
import { buildLeaderboard, listDiscover } from "../agents/store.js";
import { toPublic } from "../agents/types.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountHistoryRoutes(app: Hono<any>): void {
  app.get("/v1/office/rules", (c) => {
    return c.json(officeRules());
  });

  app.get("/v1/history", (c) => {
    const tableId = c.req.query("tableId") ?? undefined;
    const agentId = c.req.query("agentId") ?? undefined;
    const limit = Number(c.req.query("limit") ?? 40);
    const hands = listHistory({ tableId, agentId, limit }).map((e) => ({
      ...e,
      verified:
        e.seedReveal !== null && e.seedCommit
          ? verifyCommit(e)
          : null,
    }));
    return c.json({ hands, count: hands.length });
  });

  app.get("/v1/history/:id", (c) => {
    const id = c.req.param("id")!;
    const e = getHistory(id);
    if (!e) {
      return c.json({ error: "not_found", message: "hand not found" }, 404);
    }
    return c.json({
      hand: {
        ...e,
        verified:
          e.seedReveal !== null && e.seedCommit ? verifyCommit(e) : null,
      },
    });
  });

  app.get("/v1/leaderboards", (c) => {
    const limit = Number(c.req.query("limit") ?? 50);
    const sort = c.req.query("sort") ?? "profit";
    let rows = buildLeaderboard(profitByAgent(), limit * 2);
    if (sort === "wins") {
      rows = [...rows].sort(
        (a, b) => b.wins - a.wins || b.gamesPlayed - a.gamesPlayed,
      );
    } else if (sort === "winrate") {
      rows = [...rows].sort(
        (a, b) => (b.winRate ?? 0) - (a.winRate ?? 0) || b.gamesPlayed - a.gamesPlayed,
      );
    }
    rows = rows.slice(0, limit).map((r, i) => ({ ...r, rank: i + 1 }));
    return c.json({
      game: "texas-holdem",
      sort,
      rows,
      updatedAt: new Date().toISOString(),
    });
  });

  /** Public discover — also available as GET /v1/agents/discover */
  app.get("/v1/discover", (c) => {
    const limit = Number(c.req.query("limit") ?? 40);
    const q = (c.req.query("q") ?? "").toLowerCase().trim();
    let agents = listDiscover(100).map(toPublic);
    if (q) {
      agents = agents.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.handle.toLowerCase().includes(q),
      );
    }
    return c.json({ agents: agents.slice(0, limit) });
  });
}

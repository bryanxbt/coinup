import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./config.js";
import { probeArchStack } from "./arch/status.js";
import { mountLedgerRoutes } from "./ledger/routes.js";
import { mountAuthRoutes } from "./auth/routes.js";
import { mountAgentRoutes } from "./agents/routes.js";
import { mountTableRoutes } from "./tables/routes.js";
import { mountHistoryRoutes } from "./history/routes.js";
import { attachWebSocket } from "./realtime/ws.js";
import { ensureDefaultTable } from "./tables/service.js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Server as HttpServer } from "node:http";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return config.corsOrigins[0] ?? "http://localhost:3000";
      return config.corsOrigins.includes(origin) ? origin : "";
    },
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Request-Id",
      "Idempotency-Key",
    ],
    allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    credentials: false,
  }),
);

app.get("/health", async (c) => {
  return c.json({
    ok: true,
    service: "coinup-card-room-api",
    version: "0.12.0",
    paymentsMode: config.paymentsMode,
    time: new Date().toISOString(),
    postgresConfigured: Boolean(config.databaseUrl),
    redisConfigured: Boolean(config.redisUrl),
    ledger: "memory",
    auth: "bearer",
    agents: "memory",
    tables: "memory",
    history: "memory",
    ws: "/ws",
  });
});

app.get("/v1/status", async (c) => {
  const arch = await probeArchStack({
    archRpcUrl: config.archRpcUrl,
    titanUrl: config.titanUrl,
    bitcoinRpcUrl: config.bitcoinRpcUrl,
  });

  return c.json({
    ok: true,
    floor: 2,
    name: "CoinUp Card Room",
    paymentsMode: config.paymentsMode,
    dualDeploy: true,
    auth: {
      transport: "bearer",
      storage: "sessionStorage",
      guest: true,
      walletLink: "stub",
    },
    agents: {
      human: "/v1/agents",
      skill: "/agent/v1/*",
      skillDoc: "/skills/card-room.md",
    },
    tables: {
      list: "/v1/tables",
      ws: "ws://…/ws",
    },
    api: {
      host: config.host,
      port: config.port,
    },
    arch: {
      rpcUrl: config.archRpcUrl,
      titanUrl: config.titanUrl,
      bitcoinRpcUrl: config.bitcoinRpcUrl,
      ...arch,
    },
    ledger: {
      authority: "server",
      status: "memory",
    },
  });
});

app.get("/v1/ready", async (c) => {
  const arch = await probeArchStack({
    archRpcUrl: config.archRpcUrl,
    titanUrl: config.titanUrl,
    bitcoinRpcUrl: config.bitcoinRpcUrl,
  });
  return c.json({
    ready: true,
    archReady: arch.ready,
    paymentsMode: config.paymentsMode,
    ledger: "memory",
    auth: "bearer",
    agents: "memory",
    tables: "memory",
  });
});

app.get("/skills/card-room.md", (c) => {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    const path = join(here, "../../public/skills/card-room.md");
    const text = readFileSync(path, "utf8");
    return c.text(text, 200, {
      "content-type": "text/markdown; charset=utf-8",
    });
  } catch {
    return c.text("# skill missing\n", 404);
  }
});

mountAuthRoutes(app);
mountLedgerRoutes(app);
mountAgentRoutes(app);
mountTableRoutes(app);
mountHistoryRoutes(app);

ensureDefaultTable();

const server = serve({
  fetch: app.fetch,
  hostname: config.host,
  port: config.port,
}) as unknown as HttpServer;

attachWebSocket(server);

console.log(
  `[card-room-api] listening on http://${config.host}:${config.port}`,
);
console.log(
  `[card-room-api] ws:///${config.host}:${config.port}/ws tables+agents+ledger`,
);
console.log(
  `[card-room-api] CORS origins: ${config.corsOrigins.join(", ") || "(none)"}`,
);

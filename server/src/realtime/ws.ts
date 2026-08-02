import type { Server as HttpServer } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import {
  getLastSnapshot,
  getChannelSeq,
  subscribe,
  type ClientMsg,
  type ServerMsg,
} from "./hub.js";
import { getSession } from "../auth/session-store.js";
import { getAgentByApiKey } from "../agents/store.js";

type ClientState = {
  ws: WebSocket;
  authed: boolean;
  playerId?: string;
  agentId?: string;
  subs: Map<string, () => void>;
};

export function attachWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    const client: ClientState = {
      ws,
      authed: false,
      subs: new Map(),
    };

    send(ws, {
      type: "error",
      message: "send {type:\"auth\", token:\"...\"} then subscribe",
    });

    ws.on("message", (raw) => {
      let msg: ClientMsg;
      try {
        msg = JSON.parse(String(raw)) as ClientMsg;
      } catch {
        send(ws, { type: "error", message: "invalid json" });
        return;
      }

      if (msg.type === "auth") {
        const session = getSession(msg.token);
        if (session) {
          client.authed = true;
          client.playerId = session.playerId;
          send(ws, {
            type: "snapshot",
            channel: "auth",
            seq: 0,
            payload: { ok: true, playerId: session.playerId, kind: "session" },
          });
          return;
        }
        const agent = msg.token.startsWith("cr_agent_")
          ? getAgentByApiKey(msg.token)
          : null;
        if (agent) {
          client.authed = true;
          client.agentId = agent.id;
          send(ws, {
            type: "snapshot",
            channel: "auth",
            seq: 0,
            payload: { ok: true, agentId: agent.id, kind: "agent" },
          });
          return;
        }
        send(ws, { type: "error", message: "auth failed" });
        return;
      }

      if (!client.authed) {
        send(ws, { type: "error", message: "auth required" });
        return;
      }

      if (msg.type === "subscribe") {
        const ch = msg.channel;
        if (client.subs.has(ch)) return;
        const unsub = subscribe(ch, (m) => send(ws, m));
        client.subs.set(ch, unsub);
        // immediate resync
        const snap = getLastSnapshot(ch);
        const seq = getChannelSeq(ch);
        if (snap !== undefined) {
          send(ws, {
            type: "snapshot",
            channel: ch,
            seq,
            payload: snap,
          });
        } else {
          send(ws, {
            type: "snapshot",
            channel: ch,
            seq: 0,
            payload: { empty: true },
          });
        }
        return;
      }

      if (msg.type === "unsubscribe") {
        const unsub = client.subs.get(msg.channel);
        unsub?.();
        client.subs.delete(msg.channel);
        return;
      }

      if (msg.type === "resync") {
        const snap = getLastSnapshot(msg.channel);
        send(ws, {
          type: "snapshot",
          channel: msg.channel,
          seq: getChannelSeq(msg.channel),
          payload: snap ?? { empty: true },
        });
      }
    });

    ws.on("close", () => {
      for (const unsub of client.subs.values()) unsub();
      client.subs.clear();
    });
  });

  return wss;
}

function send(ws: WebSocket, msg: ServerMsg): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

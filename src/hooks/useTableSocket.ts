"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ensureSession, getSessionToken } from "@/lib/card-room/session";
import { ensureRuntimeConfig } from "@/lib/card-room/runtime-config";
import { wsBase } from "@/lib/card-room/tables-client";

export type WsServerMsg = {
  type: string;
  channel?: string;
  seq?: number;
  payload?: unknown;
  message?: string;
  agentId?: string;
  summary?: unknown;
};

/**
 * Card Room table WebSocket — auth with session bearer, subscribe to channel.
 */
export function useTableSocket(channel: string | null) {
  const [connected, setConnected] = useState(false);
  const [lastMsg, setLastMsg] = useState<WsServerMsg | null>(null);
  const [tablePayload, setTablePayload] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(async () => {
    if (!channel) return;
    try {
      await ensureRuntimeConfig();
      await ensureSession();
      const token = getSessionToken();
      if (!token) throw new Error("no session");

      const ws = new WebSocket(wsBase());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        setError(null);
        ws.send(JSON.stringify({ type: "auth", token }));
        ws.send(JSON.stringify({ type: "subscribe", channel }));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as WsServerMsg;
          setLastMsg(msg);
          if (
            (msg.type === "snapshot" || msg.type === "delta") &&
            msg.channel === channel
          ) {
            setTablePayload(msg.payload);
          }
          if (msg.type === "error" && msg.message) {
            setError(msg.message);
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        setConnected(false);
      };

      ws.onerror = () => {
        setError("WebSocket error");
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : "ws failed");
    }
  }, [channel]);

  useEffect(() => {
    void connect();
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { connected, lastMsg, tablePayload, error, reconnect: connect };
}

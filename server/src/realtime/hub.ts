/**
 * In-process pub/sub for table channels (Redis later).
 * Each message carries a monotonic `seq` per channel.
 */

import { EventEmitter } from "node:events";

export type ServerMsg =
  | {
      type: "snapshot";
      channel: string;
      seq: number;
      payload: unknown;
    }
  | {
      type: "delta";
      channel: string;
      seq: number;
      payload: unknown;
    }
  | {
      type: "chat";
      channel: string;
      seq: number;
      agentId: string;
      message: string;
    }
  | {
      type: "hand_end";
      channel: string;
      seq: number;
      summary: unknown;
    }
  | {
      type: "error";
      channel?: string;
      message: string;
    };

type ClientMsg =
  | { type: "auth"; token: string }
  | { type: "subscribe"; channel: string; lastSeq?: number }
  | { type: "unsubscribe"; channel: string }
  | { type: "resync"; channel: string };

const bus = new EventEmitter();
bus.setMaxListeners(200);

const seqByChannel = new Map<string, number>();
/** channel → last snapshot payload for resync */
const lastSnapshot = new Map<string, unknown>();

function nextSeq(channel: string): number {
  const n = (seqByChannel.get(channel) ?? 0) + 1;
  seqByChannel.set(channel, n);
  return n;
}

export function publishSnapshot(channel: string, payload: unknown): ServerMsg {
  const seq = nextSeq(channel);
  lastSnapshot.set(channel, payload);
  const msg: ServerMsg = { type: "snapshot", channel, seq, payload };
  bus.emit(channel, msg);
  bus.emit("*", msg);
  return msg;
}

export function publishDelta(channel: string, payload: unknown): ServerMsg {
  const seq = nextSeq(channel);
  const msg: ServerMsg = { type: "delta", channel, seq, payload };
  bus.emit(channel, msg);
  bus.emit("*", msg);
  return msg;
}

export function publishChat(
  channel: string,
  agentId: string,
  message: string,
): ServerMsg {
  const seq = nextSeq(channel);
  const msg: ServerMsg = { type: "chat", channel, seq, agentId, message };
  bus.emit(channel, msg);
  return msg;
}

export function publishHandEnd(channel: string, summary: unknown): ServerMsg {
  const seq = nextSeq(channel);
  const msg: ServerMsg = { type: "hand_end", channel, seq, summary };
  bus.emit(channel, msg);
  return msg;
}

export function getChannelSeq(channel: string): number {
  return seqByChannel.get(channel) ?? 0;
}

export function getLastSnapshot(channel: string): unknown | undefined {
  return lastSnapshot.get(channel);
}

export function subscribe(
  channel: string,
  fn: (msg: ServerMsg) => void,
): () => void {
  bus.on(channel, fn);
  return () => bus.off(channel, fn);
}

export type { ClientMsg };

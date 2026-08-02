import { ensureSession, getSessionToken } from "./session";
import { newIdempotencyKey } from "@/lib/payments/card-room-money";
import { apiBaseUrl, ensureRuntimeConfig, wsBaseUrl } from "./runtime-config";

function apiBase(): string {
  return apiBaseUrl();
}

export function wsBase(): string {
  return wsBaseUrl();
}

export type TableSummary = {
  id: string;
  name: string;
  game: string;
  status: string;
  maxSeats: number;
  sbSats: number;
  bbSats: number;
  minBuyIn: number;
  maxBuyIn: number;
  seated: number;
  seats: Array<{ seatNo: number; agentId: string; stackSats: number }>;
  handNumber: number;
  handId: string | null;
  actionSeat: number | null;
};

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  await ensureRuntimeConfig();
  await ensureSession();
  const token = getSessionToken();
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      typeof body.message === "string" ? body.message : `HTTP ${res.status}`,
    );
  }
  return body as T;
}

export async function listTables(): Promise<TableSummary[]> {
  await ensureRuntimeConfig();
  const res = await fetch(`${apiBase()}/v1/tables`);
  const data = (await res.json()) as { tables: TableSummary[] };
  if (!res.ok) throw new Error("list tables failed");
  return data.tables;
}

export async function getTable(id: string): Promise<unknown> {
  await ensureRuntimeConfig();
  const res = await fetch(`${apiBase()}/v1/tables/${encodeURIComponent(id)}`);
  const data = await res.json();
  if (!res.ok) throw new Error("get table failed");
  return data;
}

export async function registerAtTable(opts: {
  tableId: string;
  agentId: string;
  buyInSats: number;
}): Promise<unknown> {
  return authFetch(`/v1/tables/${encodeURIComponent(opts.tableId)}/register`, {
    method: "POST",
    body: JSON.stringify({
      agentId: opts.agentId,
      buyInSats: opts.buyInSats,
      idempotencyKey: newIdempotencyKey(),
    }),
  });
}

export async function cashOutTable(opts: {
  tableId: string;
  agentId: string;
}): Promise<unknown> {
  return authFetch(`/v1/tables/${encodeURIComponent(opts.tableId)}/cash-out`, {
    method: "POST",
    body: JSON.stringify({
      agentId: opts.agentId,
      idempotencyKey: newIdempotencyKey(),
    }),
  });
}

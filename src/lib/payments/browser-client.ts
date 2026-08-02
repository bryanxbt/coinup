/**
 * Card Room browser facade → server ledger (authoritative).
 * Bearer auth via sessionStorage (dual-deploy safe).
 */

import type {
  ArcadeBalance,
  CrBuyInRequest,
  CrCashOutTableRequest,
  CrFaucetRequest,
  CrRefundEntryRequest,
  CrTournamentEntryRequest,
  CrWithdrawRequest,
  MoneyResult,
  PaymentNetwork,
} from "./types";
import { newIdempotencyKey } from "./card-room-money";
import {
  ensureSession,
  getSessionToken,
} from "@/lib/card-room/session";

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_CR_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8787"
  );
}

async function authHeaders(): Promise<Record<string, string>> {
  let token = getSessionToken();
  if (!token) {
    const s = await ensureSession();
    token = s.token;
  }
  return {
    "content-type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function jsonFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    if (res.status === 401) {
      // Force re-session on next call
      const { clearSession } = await import("@/lib/card-room/session");
      clearSession();
    }
    const msg =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export class CardRoomPaymentClient {
  readonly network: PaymentNetwork;

  constructor(network: PaymentNetwork = "mock") {
    this.network =
      (process.env.NEXT_PUBLIC_PAYMENTS_MODE as PaymentNetwork) || network;
  }

  /** Ensures guest session exists, then returns balance for session player. */
  async getBalance(_playerId?: string): Promise<ArcadeBalance> {
    await ensureSession();
    return jsonFetch(`/v1/ledger/balance`);
  }

  faucet(req: Omit<CrFaucetRequest, "playerId"> & { playerId?: string }): Promise<MoneyResult> {
    return jsonFetch("/v1/ledger/faucet", {
      method: "POST",
      body: JSON.stringify({
        amountSats: req.amountSats,
        idempotencyKey: req.idempotencyKey ?? newIdempotencyKey(),
      }),
    });
  }

  deposit(req: {
    playerId?: string;
    amountSats: number;
    idempotencyKey?: string;
  }): Promise<MoneyResult> {
    return jsonFetch("/v1/ledger/deposit", {
      method: "POST",
      body: JSON.stringify({
        amountSats: req.amountSats,
        idempotencyKey: req.idempotencyKey ?? newIdempotencyKey(),
      }),
    });
  }

  withdraw(req: CrWithdrawRequest): Promise<MoneyResult> {
    return jsonFetch("/v1/ledger/withdraw", {
      method: "POST",
      body: JSON.stringify({
        amountSats: req.amountSats,
        idempotencyKey: req.idempotencyKey,
      }),
    });
  }

  buyIn(req: CrBuyInRequest): Promise<MoneyResult> {
    return jsonFetch("/v1/ledger/buy-in", {
      method: "POST",
      body: JSON.stringify({
        tableId: req.tableId,
        agentId: req.agentId,
        amountSats: req.amountSats,
        idempotencyKey: req.idempotencyKey,
      }),
    });
  }

  cashOutTable(req: CrCashOutTableRequest): Promise<MoneyResult> {
    return jsonFetch("/v1/ledger/cash-out", {
      method: "POST",
      body: JSON.stringify({
        tableId: req.tableId,
        agentId: req.agentId,
        amountSats: req.amountSats,
        idempotencyKey: req.idempotencyKey,
      }),
    });
  }

  tournamentEntry(req: CrTournamentEntryRequest): Promise<MoneyResult> {
    return jsonFetch("/v1/ledger/tournament-entry", {
      method: "POST",
      body: JSON.stringify({
        tournamentId: req.tournamentId,
        agentId: req.agentId,
        amountSats: req.amountSats,
        idempotencyKey: req.idempotencyKey,
      }),
    });
  }

  refundEntry(req: CrRefundEntryRequest): Promise<MoneyResult> {
    return jsonFetch("/v1/ledger/refund", {
      method: "POST",
      body: JSON.stringify({
        refType: req.refType,
        refId: req.refId,
        reason: req.reason,
        amountSats: req.amountSats,
        idempotencyKey: req.idempotencyKey,
      }),
    });
  }
}

export const cardRoomPaymentClient = new CardRoomPaymentClient();

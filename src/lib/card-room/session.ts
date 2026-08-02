/**
 * Card Room dual-deploy auth — bearer token in sessionStorage (not cookies).
 */

import { getPlayerId } from "@/lib/player";

const TOKEN_KEY = "cr_session_token";
const PLAYER_KEY = "cr_session_player";
const EXPIRES_KEY = "cr_session_expires";

export type CrSession = {
  token: string;
  playerId: string;
  kind: "guest" | "wallet";
  expiresAt: string;
  canWithdraw: boolean;
};

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_CR_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8787"
  );
}

function readStored(): { token: string; playerId: string; expiresAt: string } | null {
  if (typeof window === "undefined") return null;
  const token = sessionStorage.getItem(TOKEN_KEY);
  const playerId = sessionStorage.getItem(PLAYER_KEY);
  const expiresAt = sessionStorage.getItem(EXPIRES_KEY);
  if (!token || !playerId || !expiresAt) return null;
  if (Date.parse(expiresAt) < Date.now()) {
    clearSession();
    return null;
  }
  return { token, playerId, expiresAt };
}

export function getSessionToken(): string | null {
  return readStored()?.token ?? null;
}

export function getSessionPlayerId(): string | null {
  return readStored()?.playerId ?? null;
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(PLAYER_KEY);
  sessionStorage.removeItem(EXPIRES_KEY);
}

function storeSession(s: {
  token: string;
  playerId: string;
  expiresAt: string;
}): void {
  sessionStorage.setItem(TOKEN_KEY, s.token);
  sessionStorage.setItem(PLAYER_KEY, s.playerId);
  sessionStorage.setItem(EXPIRES_KEY, s.expiresAt);
}

/** Ensure a guest bearer session exists; reuses sessionStorage across reloads. */
export async function ensureSession(): Promise<CrSession> {
  const existing = readStored();
  if (existing) {
    // Soft revalidate
    try {
      const res = await fetch(`${apiBase()}/v1/auth/me`, {
        headers: { Authorization: `Bearer ${existing.token}` },
      });
      if (res.ok) {
        const me = (await res.json()) as {
          playerId: string;
          kind: "guest" | "wallet";
          expiresAt: string;
          canWithdraw: boolean;
        };
        return {
          token: existing.token,
          playerId: me.playerId,
          kind: me.kind,
          expiresAt: me.expiresAt,
          canWithdraw: me.canWithdraw,
        };
      }
    } catch {
      /* create fresh below */
    }
    clearSession();
  }

  const guestId = getPlayerId();
  const res = await fetch(`${apiBase()}/v1/auth/session`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ guestId }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || `auth session failed (${res.status})`);
  }
  const data = (await res.json()) as {
    token: string;
    playerId: string;
    kind: "guest" | "wallet";
    expiresAt: string;
    canWithdraw: boolean;
  };
  storeSession({
    token: data.token,
    playerId: data.playerId,
    expiresAt: data.expiresAt,
  });
  return {
    token: data.token,
    playerId: data.playerId,
    kind: data.kind,
    expiresAt: data.expiresAt,
    canWithdraw: data.canWithdraw,
  };
}

export async function linkWalletStub(opts: {
  pubkey: string;
  signature: string;
  message: string;
}): Promise<CrSession> {
  const token = getSessionToken();
  if (!token) throw new Error("no session");
  const res = await fetch(`${apiBase()}/v1/auth/wallet/link`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(opts),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || "wallet link failed");
  }
  const data = (await res.json()) as {
    playerId: string;
    kind: "guest" | "wallet";
    expiresAt: string;
    canWithdraw: boolean;
    token?: string;
  };
  storeSession({
    token: data.token ?? token,
    playerId: data.playerId,
    expiresAt: data.expiresAt,
  });
  return {
    token: data.token ?? token,
    playerId: data.playerId,
    kind: data.kind,
    expiresAt: data.expiresAt,
    canWithdraw: data.canWithdraw,
  };
}

export async function logoutSession(): Promise<void> {
  const token = getSessionToken();
  if (token) {
    try {
      await fetch(`${apiBase()}/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignore */
    }
  }
  clearSession();
}

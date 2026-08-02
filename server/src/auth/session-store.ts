import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

export type SessionKind = "guest" | "wallet";

export interface Session {
  token: string;
  playerId: string;
  kind: SessionKind;
  /** Bound wallet pubkey when kind=wallet */
  walletPubkey?: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const sessions = new Map<string, Session>();

function tokenHash(token: string): string {
  return createHmac("sha256", config.sessionSecret).update(token).digest("hex");
}

function mintToken(): string {
  return `cr_${randomBytes(32).toString("base64url")}`;
}

export function createGuestSession(guestId?: string): Session {
  const playerId =
    guestId && /^[a-zA-Z0-9_.-]{3,64}$/.test(guestId)
      ? guestId
      : `player_${randomBytes(8).toString("hex")}`;
  const token = mintToken();
  const now = Date.now();
  const session: Session = {
    token,
    playerId,
    kind: "guest",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
    lastSeenAt: new Date(now).toISOString(),
  };
  sessions.set(tokenHash(token), session);
  return session;
}

export function getSession(token: string | undefined | null): Session | null {
  if (!token) return null;
  const rec = sessions.get(tokenHash(token));
  if (!rec) return null;
  if (Date.parse(rec.expiresAt) < Date.now()) {
    sessions.delete(tokenHash(token));
    return null;
  }
  rec.lastSeenAt = new Date().toISOString();
  return rec;
}

export function revokeSession(token: string): boolean {
  return sessions.delete(tokenHash(token));
}

/**
 * Wallet link stub — records pubkey after client proves signature later.
 * MVP accepts claim when paymentsMode=mock for local UX; real verify in Arch phase.
 */
export function linkWallet(
  token: string,
  opts: { pubkey: string; signature: string; message: string },
): Session {
  const session = getSession(token);
  if (!session) {
    throw new AuthError("unauthorized", 401, "invalid or expired session");
  }
  if (!opts.pubkey || opts.pubkey.length < 8) {
    throw new AuthError("invalid_request", 400, "pubkey required");
  }
  if (!opts.signature || !opts.message) {
    throw new AuthError(
      "invalid_request",
      400,
      "signature and message required",
    );
  }
  // Production: verify message signature for pubkey. Mock: accept structure.
  if (config.paymentsMode !== "mock") {
    // Placeholder gate until Arch wallet SDK wired
    if (!opts.message.startsWith("coinup:link:")) {
      throw new AuthError("invalid_signature", 401, "bad link message");
    }
  }
  session.kind = "wallet";
  session.walletPubkey = opts.pubkey;
  sessions.set(tokenHash(token), session);
  return session;
}

export function publicSession(session: Session) {
  return {
    playerId: session.playerId,
    kind: session.kind,
    walletPubkey: session.walletPubkey ?? null,
    expiresAt: session.expiresAt,
    canWithdraw: session.kind === "wallet",
  };
}

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Constant-time compare helper for future secret checks. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

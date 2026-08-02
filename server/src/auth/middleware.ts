import type { Context, Next } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  AuthError,
  getSession,
  type Session,
} from "./session-store.js";

export type AuthVariables = {
  session: Session;
};

function extractBearer(c: Context): string | null {
  const h = c.req.header("authorization") ?? c.req.header("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1]?.trim() || null;
}

/** Require valid bearer session. Sets c.get("session"). */
export async function requireSession(c: Context, next: Next) {
  try {
    const token = extractBearer(c);
    const session = getSession(token);
    if (!session) {
      return c.json(
        {
          error: "unauthorized",
          message: "Bearer session required. POST /v1/auth/session first.",
        },
        401,
      );
    }
    c.set("session", session);
    await next();
  } catch (err) {
    if (err instanceof AuthError) {
      return c.json(
        { error: err.code, message: err.message },
        err.status as ContentfulStatusCode,
      );
    }
    throw err;
  }
}

/** Require wallet-linked session for withdraw-to-BTC paths. */
export async function requireWallet(c: Context, next: Next) {
  const session = c.get("session") as Session | undefined;
  if (!session) {
    return c.json({ error: "unauthorized", message: "session required" }, 401);
  }
  if (session.kind !== "wallet" || !session.walletPubkey) {
    return c.json(
      {
        error: "wallet_required",
        message: "Link a wallet before withdraw-to-BTC",
      },
      403,
    );
  }
  await next();
}

export { extractBearer };

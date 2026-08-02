import type { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import {
  AuthError,
  createGuestSession,
  getSession,
  linkWallet,
  publicSession,
  revokeSession,
  type Session,
} from "./session-store.js";
import { extractBearer, requireSession } from "./middleware.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mountAuthRoutes(app: Hono<any>): void {
  /** Guest session — dual-deploy bearer in sessionStorage */
  app.post("/v1/auth/session", async (c) => {
    try {
      const body = (await c.req.json().catch(() => ({}))) as {
        guestId?: string;
      };
      const session = createGuestSession(body.guestId);
      return c.json({
        token: session.token,
        playerId: session.playerId,
        kind: session.kind,
        expiresAt: session.expiresAt,
        canWithdraw: false,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json(
          { error: err.code, message: err.message },
          err.status as ContentfulStatusCode,
        );
      }
      throw err;
    }
  });

  app.get("/v1/auth/me", requireSession, (c) => {
    // Hono Variables typing is loose across mount helpers
    const session = (c as { get: (k: string) => Session }).get("session");
    return c.json(publicSession(session));
  });

  app.post("/v1/auth/logout", (c) => {
    const token = extractBearer(c);
    if (token) revokeSession(token);
    return c.json({ ok: true });
  });

  /** Wallet link stub — upgrades guest → wallet-linked */
  app.post("/v1/auth/wallet/link", requireSession, async (c) => {
    try {
      const token = extractBearer(c)!;
      const body = (await c.req.json()) as {
        pubkey?: string;
        signature?: string;
        message?: string;
      };
      const session = linkWallet(token, {
        pubkey: body.pubkey ?? "",
        signature: body.signature ?? "",
        message: body.message ?? "",
      });
      return c.json({
        ...publicSession(session),
        token, // same bearer, upgraded
      });
    } catch (err) {
      if (err instanceof AuthError) {
        return c.json(
          { error: err.code, message: err.message },
          err.status as ContentfulStatusCode,
        );
      }
      throw err;
    }
  });

  /** Challenge message for future wallet sign */
  app.get("/v1/auth/wallet/challenge", requireSession, (c) => {
    const session = (c as { get: (k: string) => Session }).get("session");
    const nonce = `coinup:link:${session.playerId}:${Date.now()}`;
    return c.json({
      message: nonce,
      note: "Sign this message with your wallet; POST /v1/auth/wallet/link",
    });
  });

  /** Debug: validate token without full me (public health of auth path) */
  app.get("/v1/auth/ping", (c) => {
    const session = getSession(extractBearer(c));
    return c.json({
      authenticated: Boolean(session),
      playerId: session?.playerId ?? null,
    });
  });
}

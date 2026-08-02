/**
 * Dual-deploy Card Room endpoints.
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_CR_API_URL / NEXT_PUBLIC_CR_WS_URL (build-time / local .env)
 * 2. /card-room-runtime.json on the static host (GitHub Pages can point at a live API)
 * 3. Dev default http://127.0.0.1:8787
 */

import { withBase } from "@/lib/paths";

export type CardRoomRuntime = {
  apiUrl: string;
  wsUrl: string;
  paymentsMode?: string;
  source: "env" | "runtime-json" | "default";
};

const LOCAL_DEFAULT = "http://127.0.0.1:8787";

let resolved: CardRoomRuntime | null = null;
let loadPromise: Promise<CardRoomRuntime> | null = null;

function stripSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function httpToWs(httpUrl: string): string {
  const base = stripSlash(httpUrl);
  return base.replace(/^http/, "ws") + "/ws";
}

function fromEnv(): CardRoomRuntime | null {
  const api = process.env.NEXT_PUBLIC_CR_API_URL?.trim();
  if (!api) return null;
  const apiUrl = stripSlash(api);
  const wsRaw = process.env.NEXT_PUBLIC_CR_WS_URL?.trim();
  const wsUrl = wsRaw
    ? wsRaw.includes("/ws")
      ? wsRaw
      : `${stripSlash(wsRaw)}/ws`
    : httpToWs(apiUrl);
  return {
    apiUrl,
    wsUrl: wsUrl.replace(/^http/, "ws"),
    paymentsMode: process.env.NEXT_PUBLIC_PAYMENTS_MODE,
    source: "env",
  };
}

function isBrowserLocal(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

/**
 * Sync read — may still be default until ensureRuntimeConfig() completes.
 * Prefer awaiting ensureRuntimeConfig() before first network call.
 */
export function getRuntimeConfig(): CardRoomRuntime {
  if (resolved) return resolved;
  const env = fromEnv();
  if (env) {
    resolved = env;
    return env;
  }
  return {
    apiUrl: LOCAL_DEFAULT,
    wsUrl: httpToWs(LOCAL_DEFAULT),
    paymentsMode: process.env.NEXT_PUBLIC_PAYMENTS_MODE ?? "mock",
    source: "default",
  };
}

export function apiBaseUrl(): string {
  return getRuntimeConfig().apiUrl;
}

export function wsBaseUrl(): string {
  return getRuntimeConfig().wsUrl;
}

/** Load runtime JSON once (no-op if env already set). Safe to call many times. */
export function ensureRuntimeConfig(): Promise<CardRoomRuntime> {
  if (resolved && resolved.source !== "default") {
    return Promise.resolve(resolved);
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const env = fromEnv();
    if (env) {
      resolved = env;
      return env;
    }

    // On localhost without env, prefer local API — skip remote JSON.
    if (isBrowserLocal()) {
      resolved = {
        apiUrl: LOCAL_DEFAULT,
        wsUrl: httpToWs(LOCAL_DEFAULT),
        paymentsMode: "mock",
        source: "default",
      };
      return resolved;
    }

    try {
      const res = await fetch(withBase("/card-room-runtime.json"), {
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          apiUrl?: string;
          wsUrl?: string;
          paymentsMode?: string;
        };
        const raw = (data.apiUrl ?? "").trim();
        if (raw) {
          const apiUrl = stripSlash(raw);
          const wsUrl = data.wsUrl
            ? data.wsUrl.replace(/^http/, "ws")
            : httpToWs(apiUrl);
          resolved = {
            apiUrl,
            wsUrl: wsUrl.includes("/ws") ? wsUrl : `${stripSlash(wsUrl)}/ws`,
            paymentsMode: data.paymentsMode,
            source: "runtime-json",
          };
          return resolved;
        }
      }
    } catch {
      /* fall through */
    }

    // Static host without configured API — keep a sentinel so errors mention config.
    resolved = {
      apiUrl: "https://card-room-api-not-configured.invalid",
      wsUrl: "wss://card-room-api-not-configured.invalid/ws",
      paymentsMode: "mock",
      source: "default",
    };
    return resolved;
  })();

  return loadPromise;
}

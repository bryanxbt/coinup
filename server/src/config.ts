/**
 * Card Room API config — dual-deploy friendly.
 * Money authority lives here; Next static export talks via NEXT_PUBLIC_CR_API_URL
 * or public/card-room-runtime.json.
 */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid int env ${name}: ${raw}`);
  return n;
}

const isProd = process.env.NODE_ENV === "production";

/** Default CORS: local Next + GitHub Pages origin for dual-deploy. */
const DEFAULT_CORS =
  "http://localhost:3000,http://127.0.0.1:3000,https://bryanxbt.github.io";

export const config = {
  port: envInt("PORT", 8787),
  /**
   * Bind address. Production/cloud must be 0.0.0.0 so the container is reachable.
   * Local default stays loopback.
   */
  host: process.env.HOST ?? (isProd ? "0.0.0.0" : "127.0.0.1"),
  /** Comma-separated exact origins (never * with Authorization). */
  corsOrigins: (process.env.CORS_ORIGINS ?? DEFAULT_CORS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  sessionSecret: process.env.SESSION_SECRET ?? "dev-only-change-me",
  /** mock | arch-localnet | arch-testnet | arch-mainnet */
  paymentsMode: process.env.PAYMENTS_MODE ?? "mock",
  /** Postgres required for multi-party ledger; optional in PR0 health-only. */
  databaseUrl: process.env.DATABASE_URL ?? "",
  /** Optional; empty = in-process fanout. */
  redisUrl: process.env.REDIS_URL ?? "",
  /** Arch local validator RPC (see ~/.arch/local_validator_config.toml). */
  archRpcUrl: process.env.ARCH_RPC_URL ?? "http://127.0.0.1:9002",
  titanUrl: process.env.TITAN_URL ?? "http://127.0.0.1:8080",
  /** Bitcoin regtest RPC used by local Arch stack. */
  bitcoinRpcUrl: process.env.BITCOIN_RPC_URL ?? "http://127.0.0.1:18443",
  /** Path to Ship/Archie env for operators (docs only). */
  archieRoot:
    process.env.ARCHIE_ROOT ??
    process.env.SHIP_ROOT ??
    "/Volumes/BryanXBTLacie/archie",
} as const;

export type AppConfig = typeof config;

/** Integer satoshis only. */

export type Sats = number;

/** Soft cap for JS number path — not full BTC supply. */
export const MAX_SATS_NUMBER = Number.MAX_SAFE_INTEGER;

/** Per-seat / per-op game default (10 BTC equivalent). */
export const DEFAULT_MAX_STACK_SATS = 1_000_000_000;

export function assertSats(
  n: unknown,
  max: number = MAX_SATS_NUMBER,
): Sats {
  if (
    typeof n !== "number" ||
    !Number.isInteger(n) ||
    n < 0 ||
    !Number.isSafeInteger(n) ||
    n > max
  ) {
    throw new Error("invalid_sats");
  }
  return n;
}

export function formatSats(sats: Sats): string {
  if (sats >= 100_000_000) {
    return `${(sats / 100_000_000).toFixed(4)} BTC`;
  }
  return `${sats.toLocaleString()} sats`;
}

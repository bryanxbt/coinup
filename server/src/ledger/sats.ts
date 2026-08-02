/** Integer satoshis — mirrored validation for server (no browser deps). */

export type Sats = number;

export const MAX_SATS_NUMBER = Number.MAX_SAFE_INTEGER;
export const DEFAULT_MAX_STACK_SATS = 1_000_000_000;

export class LedgerError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "LedgerError";
  }
}

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
    throw new LedgerError(
      "invalid_sats",
      400,
      "amount must be a non-negative safe integer satoshi value",
    );
  }
  return n;
}

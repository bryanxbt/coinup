/**
 * Card Room money DTOs — wire shapes for the server ledger.
 * All mutating ops require idempotencyKey.
 */

export type {
  ArcadeBalance,
  CrBuyInRequest,
  CrCashOutTableRequest,
  CrFaucetRequest,
  CrRefundEntryRequest,
  CrTournamentEntryRequest,
  CrWithdrawRequest,
  LockedBreakdown,
  MoneyResult,
  PaymentNetwork,
  Sats,
} from "./types";

export { assertSats, DEFAULT_MAX_STACK_SATS, formatSats, MAX_SATS_NUMBER } from "./sats";

/** Generate a UUID v4 for Card Room money intents (button click / agent action). */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `idem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

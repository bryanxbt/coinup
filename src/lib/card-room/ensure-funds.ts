/**
 * Ensure available ledger sats ≥ need before buy-in.
 * Mock mode: faucet the shortfall. Arch modes: throw with clear message.
 */

import {
  cardRoomPaymentClient,
  newIdempotencyKey,
  type ArcadeBalance,
} from "@/lib/payments";
import { resolveFundsMode } from "@/components/card-room/FundsModeBanner";
import { notifyCardRoomBalance } from "./balance-events";

export async function ensureAvailableSats(
  needSats: number,
): Promise<ArcadeBalance> {
  let bal = await cardRoomPaymentClient.getBalance();
  if (bal.availableSats >= needSats) return bal;

  const short = needSats - bal.availableSats;
  const mode = resolveFundsMode();

  if (mode !== "mock") {
    throw new Error(
      `Need ${needSats.toLocaleString()} available sats (have ${bal.availableSats.toLocaleString()}). Deposit on ${mode} before seating.`,
    );
  }

  // Faucet shortfall + small buffer so UX isn't one-chip short next time
  const topUp = Math.max(short, needSats);
  await cardRoomPaymentClient.faucet({
    amountSats: topUp,
    idempotencyKey: newIdempotencyKey(),
  });
  bal = await cardRoomPaymentClient.getBalance();
  notifyCardRoomBalance();

  if (bal.availableSats < needSats) {
    throw new Error("Faucet did not credit enough sats — try again.");
  }
  return bal;
}

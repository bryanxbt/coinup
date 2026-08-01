import type { PaymentClient } from "./types";

/**
 * Arch Network payment client — placeholder.
 *
 * Wire this to Arch RPC + arcade programs once `programs/` lands:
 * - deposit UTXO → credit ledger
 * - insertCoin → debit + open session
 * - submitScore → optional escrow / leaderboard account
 * - withdraw → settle sats back to player
 */
export function createArchPaymentClient(
  _opts: { rpcUrl: string; network: "arch-localnet" | "arch-testnet" | "arch-mainnet" },
): PaymentClient {
  return {
    network: _opts.network,
    async getBalance() {
      throw new Error("Arch payment client not implemented yet — use mockPaymentClient.");
    },
    async deposit() {
      throw new Error("Arch payment client not implemented yet — use mockPaymentClient.");
    },
    async insertCoin() {
      throw new Error("Arch payment client not implemented yet — use mockPaymentClient.");
    },
    async submitScore() {
      throw new Error("Arch payment client not implemented yet — use mockPaymentClient.");
    },
    async claimReward() {
      throw new Error("Arch payment client not implemented yet — use mockPaymentClient.");
    },
    async withdraw() {
      throw new Error("Arch payment client not implemented yet — use mockPaymentClient.");
    },
  };
}

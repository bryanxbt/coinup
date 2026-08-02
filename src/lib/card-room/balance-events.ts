/** Cross-component balance refresh for Card Room shell. */

export const CR_BALANCE_EVENT = "coinup:cr-balance";

export function notifyCardRoomBalance(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CR_BALANCE_EVENT));
}

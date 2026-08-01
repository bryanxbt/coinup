const PLAYER_KEY = "coinup.playerId.v1";

/** Stable anonymous player id for mock credits (wallet address later). */
export function getPlayerId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(PLAYER_KEY);
  if (!id) {
    id = `player_${Math.random().toString(36).slice(2, 12)}`;
    window.localStorage.setItem(PLAYER_KEY, id);
  }
  return id;
}

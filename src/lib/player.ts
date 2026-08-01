const PLAYER_KEY = "coinup.playerId.v1";
const GUEST_KEY = "coinup.guestName.v1";

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

/** Display tag on the floor / multiplayer HUDs */
export function getGuestName(): string {
  if (typeof window === "undefined") return "GUEST";
  let name = window.localStorage.getItem(GUEST_KEY);
  if (!name) {
    const n = Math.floor(1000 + Math.random() * 9000);
    name = `PLAYER-${n}`;
    window.localStorage.setItem(GUEST_KEY, name);
  }
  return name;
}

/**
 * Cabinet Hall layout — dual-aisle floor that scales toward ~20 cabinets.
 * side: 0 = left aisle, 1 = right aisle
 * index: position down the aisle (0 = front / near entrance)
 */

import type { GameMeta } from "@/games/types";
import { listLobbyGames } from "@/games/registry";

export type FloorSlot = {
  gameId: string;
  /** 0 = left aisle, 1 = right aisle */
  side: 0 | 1;
  /** 0-based position down the aisle */
  index: number;
};

/**
 * Floor map — add new cabinets by appending with next index on either side.
 * Current roster: 8. Room code supports growth without layout rewrite.
 */
export const FLOOR_SLOTS: FloorSlot[] = [
  { gameId: "coin-drop", side: 0, index: 0 },
  { gameId: "sole-dodgeball", side: 0, index: 1 },
  { gameId: "pixel-racer", side: 0, index: 2 },
  { gameId: "rocket-run", side: 0, index: 3 },
  { gameId: "crazy-wheel", side: 1, index: 0 },
  { gameId: "memory-matrix", side: 1, index: 1 },
  { gameId: "block-stacker", side: 1, index: 2 },
  { gameId: "rock-paper-scissors", side: 1, index: 3 },
];

export type PlacedCabinet = FloorSlot & {
  game: GameMeta;
};

export function getFloorCabinets(): PlacedCabinet[] {
  const games = listLobbyGames();
  const byId = new Map(games.map((g) => [g.id, g]));
  return FLOOR_SLOTS.map((slot) => {
    const game = byId.get(slot.gameId);
    if (!game) return null;
    return { ...slot, game };
  }).filter(Boolean) as PlacedCabinet[];
}

export const FLOOR_META = {
  room: "CABINET HALL",
  zone: "MAIN FLOOR",
  tagline: "WALK THE AISLE. PICK A CABINET. INSERT SATS.",
  managerNote: "CHIP ON DUTY · ALL ACCESS",
} as const;

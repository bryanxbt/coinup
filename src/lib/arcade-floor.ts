/**
 * Cabinet Hall layout — brand book ch.09 / ch.10
 * Grid coordinates are aisle positions on the pixel floor (col, row).
 */

import type { GameMeta } from "@/games/types";
import { listLobbyGames } from "@/games/registry";

export type FloorSlot = {
  gameId: string;
  /** 0-based column on the floor grid */
  col: number;
  /** 0-based row (aisle) */
  row: number;
  /** Optional rotation label for lore (facing camera default) */
  facing?: "front";
};

/** Fixed floor map for the forever roster — expand here when cabinets arrive */
export const FLOOR_SLOTS: FloorSlot[] = [
  { gameId: "coin-drop", col: 0, row: 0 },
  { gameId: "sat-hunter", col: 1, row: 0 },
  { gameId: "pixel-racer", col: 2, row: 0 },
  { gameId: "rocket-run", col: 3, row: 0 },
  { gameId: "orange-mines", col: 0, row: 1 },
  { gameId: "memory-matrix", col: 1, row: 1 },
  { gameId: "block-stacker", col: 2, row: 1 },
  { gameId: "rock-paper-scissors", col: 3, row: 1 },
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

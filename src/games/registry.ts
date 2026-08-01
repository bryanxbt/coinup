import type { GameModule, GameMeta } from "./types";
import { CoinCatch } from "./coin-catch/CoinCatch";
import { StackSats } from "./stack-sats/StackSats";
import { RockPaperScissors } from "./rock-paper-scissors/RockPaperScissors";
import { CrazyWheel } from "./crazy-wheel/CrazyWheel";
import { officialRoster } from "@/lib/brand";

/**
 * Playable prototypes mapped onto official brand roster names.
 * See docs/brand-book — do not invent parallel titles.
 */
const coinDrop: GameModule = {
  meta: {
    id: "coin-drop",
    title: "Coin Drop",
    tagline: "Drop and cascade — bank every coin",
    description:
      "Thirty seconds on the clock. Slide the tray, catch every coin, bank the high score.",
    costSats: 500,
    avgSessionSec: 30,
    category: "reflex",
    status: "playable",
    accent: "#FF5A00",
    glyph: "🪙",
    controls: ["← →", "Drag", "Esc"],
    highScoreLabel: "Coins caught",
    players: 1,
  },
  Play: CoinCatch,
};

const blockStacker: GameModule = {
  meta: {
    id: "block-stacker",
    title: "Block Stacker",
    tagline: "Stack clean. Don't topple",
    description:
      "Time the drop. Overhang gets sliced. How high can you stack before it topples?",
    costSats: 750,
    avgSessionSec: 90,
    category: "skill",
    status: "playable",
    accent: "#736FB9",
    glyph: "🧱",
    controls: ["Space", "Click", "Esc"],
    highScoreLabel: "Floors",
    players: 1,
  },
  Play: StackSats,
};

const rockPaperScissors: GameModule = {
  meta: {
    id: "rock-paper-scissors",
    title: "Rock Paper Scissors",
    tagline: "Best of 3 live duel — winner takes the pot",
    description:
      "Two players insert coin. Best of three rock-paper-scissors. Winner takes the full pot in sats. First live multiplayer cabinet on the floor.",
    costSats: 1000,
    potSats: 2000,
    avgSessionSec: 120,
    category: "multiplayer",
    status: "playable",
    accent: "#FFD11A",
    glyph: "✊",
    controls: ["Pick", "Best of 3"],
    highScoreLabel: "Duels won",
    players: 2,
  },
  Play: RockPaperScissors,
};

const crazyWheel: GameModule = {
  meta: {
    id: "crazy-wheel",
    title: "Crazy Wheel",
    tagline: "Pick a color. Spin the arc. Hit your mult",
    description:
      "Insert sats as your stake. Pick a colored wedge. Countdown, spin the crazy arc — land on your color to cash the multiplier. Miss and the house keeps the stake.",
    costSats: 1000,
    avgSessionSec: 45,
    category: "classic",
    status: "playable",
    accent: "#FFB347",
    glyph: "🎡",
    controls: ["Pick color", "Spin"],
    highScoreLabel: "Biggest hit",
    players: 1,
  },
  Play: CrazyWheel,
};

export const gameModules: GameModule[] = [
  coinDrop,
  blockStacker,
  rockPaperScissors,
  crazyWheel,
];

const playableIds = new Set(gameModules.map((g) => g.meta.id));

/** Rest of the forever roster — coming soon cabinets */
export const comingSoonMeta: GameMeta[] = officialRoster
  .filter((g) => !playableIds.has(g.id))
  .map((g) => ({
    id: g.id,
    title: g.title,
    tagline: g.blurb,
    description: `${g.blurb}. Cabinet loading — Chip is wiring this one up.`,
    costSats: 1000,
    avgSessionSec: 120,
    category: "classic" as const,
    status: "coming_soon" as const,
    accent: g.accent,
    glyph: g.glyph,
    controls: ["TBD"],
    players: 1 as const,
  }));

export function getGame(id: string): GameModule | undefined {
  return gameModules.find((g) => g.meta.id === id);
}

export function listLobbyGames(): GameMeta[] {
  return [...gameModules.map((g) => g.meta), ...comingSoonMeta];
}

import type { GameModule } from "./types";
import { CoinCatch } from "./coin-catch/CoinCatch";
import { StackSats } from "./stack-sats/StackSats";

const coinCatch: GameModule = {
  meta: {
    id: "coin-catch",
    title: "Coin Catch",
    tagline: "Catch the falling sats",
    description:
      "Thirty seconds on the clock. Slide the tray, catch every coin, bank the high score.",
    costSats: 500,
    avgSessionSec: 30,
    category: "reflex",
    status: "playable",
    accent: "#22d3ee",
    glyph: "🪙",
    controls: ["← →", "Drag", "Esc"],
    highScoreLabel: "Coins caught",
  },
  Play: CoinCatch,
};

const stackSats: GameModule = {
  meta: {
    id: "stack-sats",
    title: "Stack Sats",
    tagline: "Build the tallest tower",
    description:
      "Time the drop. Overhang gets sliced. How high can you stack before it topples?",
    costSats: 750,
    avgSessionSec: 90,
    category: "skill",
    status: "playable",
    accent: "#e879f9",
    glyph: "₿",
    controls: ["Space", "Click", "Esc"],
    highScoreLabel: "Floors",
  },
  Play: StackSats,
};

/** Placeholder cabinets — shown in lobby, not yet playable. */
export const comingSoonMeta = [
  {
    id: "ord-invaders",
    title: "Ord Invaders",
    tagline: "Defend the mempool",
    description: "Wave shooter themed around inscriptions and block space.",
    costSats: 1000,
    avgSessionSec: 120,
    category: "classic" as const,
    status: "coming_soon" as const,
    accent: "#4ade80",
    glyph: "👾",
    controls: ["← →", "Fire"],
  },
  {
    id: "hash-runner",
    title: "Hash Runner",
    tagline: "Endless side-scroll",
    description: "Sprint through difficulty epochs. Perfect for tournament pots.",
    costSats: 1000,
    avgSessionSec: 180,
    category: "classic" as const,
    status: "coming_soon" as const,
    accent: "#fbbf24",
    glyph: "🏃",
    controls: ["Jump", "Slide"],
  },
];

export const gameModules: GameModule[] = [coinCatch, stackSats];

export function getGame(id: string): GameModule | undefined {
  return gameModules.find((g) => g.meta.id === id);
}

export function listLobbyGames() {
  return [
    ...gameModules.map((g) => g.meta),
    ...comingSoonMeta,
  ];
}

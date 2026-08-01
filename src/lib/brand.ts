/**
 * CoinUp brand tokens — keep in sync with docs/BRAND.md
 * Visual source of truth: public/images/brand-guide-concept.jpg
 */

export const BRAND = {
  name: "CoinUp",
  fullName: "CoinUp Arcade",
  wordmark: "COINUP",
  lockup: "COINUP ARCADE",
  forever: "COINUP ARCADE. FOREVER.",
  mission: {
    short: "Build the greatest digital arcade ever.",
    full: "Build the greatest digital arcade ever. All games. All people. All the time.",
    bar: "OUR MISSION: BUILD THE GREATEST DIGITAL ARCADE EVER. ALL GAMES. ALL PEOPLE. ALL THE TIME.",
  },
  taglines: {
    product: "Insert Bitcoin. Play. Win Bitcoin.",
    floor: "Insert coin to continue.",
    jacket: "Insert coin. Level up.",
    oneUp: "1UP starts here.",
  },
  chain: "Arch Network",
  currency: "Bitcoin (sats)",
  assets: {
    brandGuide: "/images/brand-guide-concept.jpg",
    chipHero: "/images/chip-arcade-manager.png",
  },
} as const;

/** Core palette from brand guide + Chip portrait */
export const colors = {
  void: "#07050c",
  panel: "#0c0a12",
  ink: "#f4f0ff",
  muted: "#71717a",
  gold: "#fbbf24",
  goldHot: "#f59e0b",
  varsityBlue: "#2563eb",
  varsityBlueDeep: "#1d4ed8",
  varsityGold: "#eab308",
  crtGreen: "#4ade80",
  magenta: "#f472b6",
  purple: "#a78bfa",
  cyan: "#22d3ee",
} as const;

export type ChipExpression = "thinking" | "hyped" | "determined" | "sleep";

export const chipExpressions: Record<
  ChipExpression,
  { label: string; use: string }
> = {
  thinking: {
    label: "THINKING…",
    use: "Loading, considering, neutral manager beat",
  },
  hyped: {
    label: "HYPED",
    use: "Wins, insert coin, launch moments",
  },
  determined: {
    label: "DETERMINED",
    use: "Game start, high stakes",
  },
  sleep: {
    label: "ERROR 404: SLEEP",
    use: "Offline, night mode, empty-state humor",
  },
};

/** Official roster from brand guide — source of product naming */
export const officialRoster = [
  {
    id: "coin-drop",
    title: "Coin Drop",
    accent: "#f97316",
    glyph: "🪙",
    blurb: "Drop and cascade — bank every coin",
  },
  {
    id: "sat-hunter",
    title: "Sat Hunter",
    accent: "#4ade80",
    glyph: "🎯",
    blurb: "Lock the reticle. Hunt the sats",
  },
  {
    id: "pixel-racer",
    title: "Pixel Racer",
    accent: "#3b82f6",
    glyph: "🏎️",
    blurb: "Checkered flag, pure speed",
  },
  {
    id: "rocket-run",
    title: "Rocket Run",
    accent: "#f472b6",
    glyph: "🚀",
    blurb: "Boost vertical — don’t stall",
  },
  {
    id: "orange-mines",
    title: "Orange Mines",
    accent: "#fb923c",
    glyph: "💣",
    blurb: "Clear the grid. Mind the mines",
  },
  {
    id: "memory-matrix",
    title: "Memory Matrix",
    accent: "#22d3ee",
    glyph: "▦",
    blurb: "Match the tiles. Remember the pattern",
  },
  {
    id: "block-stacker",
    title: "Block Stacker",
    accent: "#a78bfa",
    glyph: "🧱",
    blurb: "Stack clean. Don’t topple",
  },
  {
    id: "lightning-reflex",
    title: "Lightning Reflex",
    accent: "#facc15",
    glyph: "⚡",
    blurb: "React on the bolt",
  },
] as const;

export type OfficialGameId = (typeof officialRoster)[number]["id"];

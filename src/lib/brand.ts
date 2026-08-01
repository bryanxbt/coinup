/**
 * CoinUp brand tokens — Brand Book v1.0
 * Visual source: public/images/brand-book-v1.jpg
 * Full bible: docs/brand-book/
 */

export const BRAND = {
  name: "CoinUp",
  fullName: "CoinUp Arcade",
  wordmark: "COINUP",
  lockup: "COINUP ARCADE",
  forever: "COINUP ARCADE. FOREVER.",
  taglineSite: "The Internet's Bitcoin Arcade",
  domain: "coinuparcade.com",
  version: "1.0",
  mission: {
    short: "Build the greatest digital arcade ever.",
    full: "Build the greatest digital arcade ever. All games. All people. All the time.",
    bar: "ALL GAMES. ALL PEOPLE. ALL THE TIME.",
  },
  vision:
    "A world where anyone, anywhere can play fair, fun, competitive games of chance and skill to win Bitcoin.",
  values: [
    { id: "fun", label: "FUN", blurb: "Play first. Joy is the product." },
    { id: "fair", label: "FAIR", blurb: "Clean play. Clear rules. Real scores." },
    {
      id: "community",
      label: "COMMUNITY",
      blurb: "Everyone's welcome on the floor.",
    },
    {
      id: "freedom",
      label: "FREEDOM",
      blurb: "Bitcoin. Self-custody spirit. No gatekept fun.",
    },
    {
      id: "built-to-last",
      label: "BUILT TO LAST",
      blurb: "Forever floor — not a campaign that expires.",
    },
  ],
  personality: [
    {
      id: "playful",
      label: "PLAYFUL",
      blurb: "We don't take ourselves too seriously.",
    },
    {
      id: "retro",
      label: "RETRO",
      blurb: "Inspired by the golden age of arcades.",
    },
    { id: "bold", label: "BOLD", blurb: "We go big or go home." },
    {
      id: "inclusive",
      label: "INCLUSIVE",
      blurb: "Everyone's welcome at CoinUp.",
    },
    {
      id: "degen",
      label: "DEGEN (IN A GOOD WAY)",
      blurb: "We love competition, risk, and high scores.",
    },
  ],
  taglines: {
    product: "Insert Bitcoin. Play. Win Bitcoin.",
    floor: "Insert coin to continue.",
    jacket: "Insert coin. Level up.",
    oneUp: "1UP starts here.",
    build: "Let's build the greatest arcade ever.",
  },
  chain: "Arch Network",
  currency: "Bitcoin (sats)",
  fonts: {
    display: "Coinup Pixel", // brand pixel display (fallback: system pixel / mono)
    subhead: "Press Start 2P",
    body: "Inter",
  },
  assets: {
    brandBookV1: "/images/brand-book-v1.jpg",
    brandGuideConcept: "/images/brand-guide-concept.jpg",
    /** Display (nearest-neighbor upscale of 256 grid) */
    chipHero: "/images/chip-arcade-manager.png",
    /** True pixel masters — one solid palette hex per pixel */
    chipGrid256: "/images/chip-arcade-manager-256.png",
    chipGrid128: "/images/chip-arcade-manager-128.png",
    chipGrid64: "/images/chip-arcade-manager-64.png",
    chipGrid32: "/images/chip-arcade-manager-32.png",
  },
  socialStyle: "BOLD · FUN · PIXEL PERFECT · COMMUNITY DRIVEN",
  dos: [
    "Keep it pixel perfect",
    "Use brand colors",
    "Be bold and fun",
    "Focus on Bitcoin",
    "Build community",
  ],
  donts: [
    "Don't use other brand logos",
    "Don't use gradients on pixel art",
    "Don't blur or glow pixel sprites",
    "Don't stretch the logo",
    "Don't be boring",
  ],
} as const;

/**
 * Brand Book v1.0 color system
 * Primary / Secondary / Dark UI / Accent — from brand-book-v1.jpg
 */
export const colors = {
  // Primary
  gold: "#FCC76E",
  orange: "#FF5A00",
  blue: "#2962FF",
  pink: "#FF4EC7",
  green: "#00DE76",
  // Secondary
  purple: "#736FB9",
  purpleDeep: "#3E3ABE",
  white: "#FFFFFF",
  yellowSoft: "#FFE680",
  orangeSoft: "#FFB347",
  // Dark / UI
  void: "#000012",
  panel: "#14141A",
  panelRaised: "#1C1C24",
  steel: "#2A2A33",
  steelLight: "#3A3A44",
  // Accent
  cyan: "#00D0FF",
  red: "#FF3B3B",
  yellow: "#FFD11A",
  lime: "#BAFF00",
  coral: "#FF8B6F",
  // Semantic aliases used in app
  ink: "#FFFFFF",
  muted: "#3A3A44",
  goldHot: "#FF5A00",
  varsityBlue: "#2962FF",
  varsityBlueDeep: "#3E3ABE",
  varsityGold: "#FCC76E",
  crtGreen: "#00DE76",
  magenta: "#FF4EC7",
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
    use: "Wins, insert coin, launch, new cabinet",
  },
  determined: {
    label: "DETERMINED",
    use: "Game start, high stakes, tournaments",
  },
  sleep: {
    label: "ERROR 404: SLEEP",
    use: "Offline, night mode, empty-state humor",
  },
};

/** Official forever roster */
export const officialRoster = [
  {
    id: "coin-drop",
    title: "Coin Drop",
    accent: "#FF5A00",
    glyph: "🪙",
    blurb: "Drop the coin. Land in a high multiplier slot!",
  },
  {
    id: "sat-hunter",
    title: "Sat Hunter",
    accent: "#00DE76",
    glyph: "🎯",
    blurb: "Lock the reticle. Hunt the sats",
  },
  {
    id: "pixel-racer",
    title: "Pixel Racer",
    accent: "#2962FF",
    glyph: "🏎️",
    blurb: "Checkered flag, pure speed",
  },
  {
    id: "rocket-run",
    title: "Rocket Run",
    accent: "#FF4EC7",
    glyph: "🚀",
    blurb: "Boost vertical — don't stall",
  },
  {
    id: "orange-mines",
    title: "Orange Mines",
    accent: "#FFB347",
    glyph: "💣",
    blurb: "Clear the grid. Mind the mines",
  },
  {
    id: "memory-matrix",
    title: "Memory Matrix",
    accent: "#00D0FF",
    glyph: "▦",
    blurb: "Match the tiles. Remember the pattern",
  },
  {
    id: "block-stacker",
    title: "Block Stacker",
    accent: "#736FB9",
    glyph: "🧱",
    blurb: "Stack clean. Don't topple",
  },
  {
    id: "lightning-reflex",
    title: "Lightning Reflex",
    accent: "#FFD11A",
    glyph: "⚡",
    blurb: "React on the bolt",
  },
] as const;

export type OfficialGameId = (typeof officialRoster)[number]["id"];

/** Brand Book v1 primary swatches for UI samples */
export const palettePrimary = [
  { name: "Gold", hex: colors.gold },
  { name: "Orange", hex: colors.orange },
  { name: "Blue", hex: colors.blue },
  { name: "Pink", hex: colors.pink },
  { name: "Green", hex: colors.green },
] as const;

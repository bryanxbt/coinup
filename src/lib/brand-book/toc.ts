/**
 * CoinUp Brand Book — table of contents
 * Living entertainment brand bible. Target depth: 80–120 pages.
 * Chapters live in docs/brand-book/*.md and are rendered at /brand/[slug]
 */

export type BrandChapter = {
  id: string;
  number: string;
  title: string;
  slug: string;
  summary: string;
  /** Approximate target page weight when fully illustrated */
  pageTarget: string;
  flagship?: boolean;
};

export const BRAND_BOOK = {
  title: "CoinUp Brand Book",
  subtitle: "The Internet's Bitcoin Arcade",
  version: "0.1.0",
  status: "Living document — expand, never fork",
  missionLine:
    "Build the greatest digital arcade ever. All games. All people. All the time.",
} as const;

export const chapters: BrandChapter[] = [
  {
    id: "00",
    number: "00",
    title: "Cover",
    slug: "cover",
    summary: "Title lockup, version, how to use this book",
    pageTarget: "1–2",
  },
  {
    id: "01",
    number: "01",
    title: "Brand Definition",
    slug: "brand-definition",
    summary: "Mission, vision, values, personality, promise, audience, story",
    pageTarget: "6–8",
  },
  {
    id: "02",
    number: "02",
    title: "Positioning",
    slug: "positioning",
    summary: "What we are / aren't, landscape vs casino, GameFi, DeFi, arcades",
    pageTarget: "4–6",
  },
  {
    id: "03",
    number: "03",
    title: "The World of CoinUp",
    slug: "the-world",
    summary: "The Arcade, Chip, supporting cast — the universe Arch doesn't have",
    pageTarget: "10–14",
    flagship: true,
  },
  {
    id: "04",
    number: "04",
    title: "Visual Identity",
    slug: "visual-identity",
    summary: "Logo system, lockups, safe area, incorrect usage, variants",
    pageTarget: "6–8",
  },
  {
    id: "05",
    number: "05",
    title: "Color System",
    slug: "color-system",
    summary: "Primary, secondary, CRT, pixel, cabinet, merch, a11y",
    pageTarget: "4–6",
  },
  {
    id: "06",
    number: "06",
    title: "Typography",
    slug: "typography",
    summary: "Display, pixel, body, scores, tournaments, hierarchy",
    pageTarget: "3–5",
  },
  {
    id: "07",
    number: "07",
    title: "Pixel System",
    slug: "pixel-system",
    summary: "Canonical pixel design system — CoinUp's Material Design",
    pageTarget: "12–16",
    flagship: true,
  },
  {
    id: "08",
    number: "08",
    title: "Chip Character Bible",
    slug: "chip-bible",
    summary: "Full mascot turnaround, gear, poses, expressions, versions",
    pageTarget: "16–22",
    flagship: true,
  },
  {
    id: "09",
    number: "09",
    title: "World Building",
    slug: "world-building",
    summary: "Blueprints, floor plan, prize counter, manager office, Day 1 lot",
    pageTarget: "6–8",
  },
  {
    id: "10",
    number: "10",
    title: "Cabinet System",
    slug: "cabinet-system",
    summary: "Per-game cabinet design language and roster examples",
    pageTarget: "8–12",
  },
  {
    id: "11",
    number: "11",
    title: "UI System",
    slug: "ui-system",
    summary: "Buttons, panels, wallet, leaderboards, victory/defeat",
    pageTarget: "6–8",
  },
  {
    id: "12",
    number: "12",
    title: "Motion",
    slug: "motion",
    summary: "CRT boot, transitions, glitches, coins, confetti, pixels",
    pageTarget: "3–5",
  },
  {
    id: "13",
    number: "13",
    title: "Sound Identity",
    slug: "sound-identity",
    summary: "Insert coin, victory, jackpot, music direction",
    pageTarget: "3–4",
  },
  {
    id: "14",
    number: "14",
    title: "Merchandise",
    slug: "merchandise",
    summary: "Hat, jacket, pins, tokens, jerseys, desk mats",
    pageTarget: "4–6",
  },
  {
    id: "15",
    number: "15",
    title: "Social Media",
    slug: "social-media",
    summary: "Tweet voice, memes, Chip posts, templates",
    pageTarget: "4–6",
  },
  {
    id: "16",
    number: "16",
    title: "Marketing Templates",
    slug: "marketing-templates",
    summary: "YT, TikTok, IG, X, Discord, decks, wallpapers",
    pageTarget: "4–5",
  },
  {
    id: "17",
    number: "17",
    title: "Events",
    slug: "events",
    summary: "Tournaments, overlays, brackets, stage, stream",
    pageTarget: "4–6",
  },
  {
    id: "18",
    number: "18",
    title: "Achievements",
    slug: "achievements",
    summary: "Badge system, rarity tiers, icon rules",
    pageTarget: "3–4",
  },
  {
    id: "19",
    number: "19",
    title: "Economy",
    slug: "economy",
    summary: "Sats, credits, XP, seasons, rewards presentation",
    pageTarget: "4–5",
  },
  {
    id: "20",
    number: "20",
    title: "Illustration Style",
    slug: "illustration-style",
    summary: "Pixel, CRT, vector, sticker, comic, cabinet art",
    pageTarget: "3–5",
  },
  {
    id: "21",
    number: "21",
    title: "Photography",
    slug: "photography",
    summary: "Mood, merch, events, construction, BTS",
    pageTarget: "2–4",
  },
  {
    id: "22",
    number: "22",
    title: "Environmental Graphics",
    slug: "environmental-graphics",
    summary: "Murals, neon, wayfinding, booths, containers",
    pageTarget: "3–4",
  },
  {
    id: "23",
    number: "23",
    title: "CoinUp Lore",
    slug: "lore",
    summary: "Timeline, dirt lot, first cabinet, Chip's journal",
    pageTarget: "6–8",
  },
  {
    id: "24",
    number: "24",
    title: "Copywriting",
    slug: "copywriting",
    summary: "Voice, do/don't, errors, Chip quotes, notifications",
    pageTarget: "4–6",
  },
  {
    id: "25",
    number: "25",
    title: "Brand Applications",
    slug: "brand-applications",
    summary: "Web, app, merch, billboards, decks, packaging",
    pageTarget: "4–6",
  },
];

export function getChapter(slug: string): BrandChapter | undefined {
  return chapters.find((c) => c.slug === slug);
}

export function getAdjacent(slug: string): {
  prev?: BrandChapter;
  next?: BrandChapter;
} {
  const i = chapters.findIndex((c) => c.slug === slug);
  if (i < 0) return {};
  return {
    prev: i > 0 ? chapters[i - 1] : undefined,
    next: i < chapters.length - 1 ? chapters[i + 1] : undefined,
  };
}

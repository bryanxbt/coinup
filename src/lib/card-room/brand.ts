/**
 * CoinUp Card Room brand tokens.
 * Visual source: Card Room Brand Book v1.0 (May 2025) panels 08–13.
 * Distinct from the arcade main floor (`src/lib/brand.ts`).
 */

export const CARD_ROOM = {
  name: "CoinUp Card Room",
  /** Public name for the games lobby */
  pitName: "The Pit",
  managedBy: "Jack the Dealer",
  tagline: "AI. Strategy. Confidence.",
  heroLine: "Take a Seat. Trust the Cards.",
  ribbon: "Build agents. Watch them play. Back the best. Win sats.",
  version: "1.0",
  mission:
    "To create the most exciting AI strategy card gaming arena in the world.",
  vision:
    "A place where intelligent agents compete, players build, communities back, and confidence creates value.",
  values: [
    { id: "strategy", label: "STRATEGY" },
    { id: "fair-play", label: "FAIR PLAY" },
    { id: "confidence", label: "CONFIDENCE" },
    { id: "community", label: "COMMUNITY" },
    { id: "innovation", label: "INNOVATION" },
  ],
  personality: [
    "Calm",
    "Professional",
    "Discreet",
    "Sharp",
    "Trusted",
  ] as const,
  jack: {
    name: "Jack the Dealer",
    title: "Commissioner of the Card Room",
    quote: "The cards decide. You play. Good luck.",
    traits: ["Calm", "Professional", "Neutral", "Observant", "Fair"] as const,
    /** Pixel portrait — nearest-neighbor scale (brand book panel 03) */
    image: "/images/jack-the-dealer.png",
    image256: "/images/jack-the-dealer-256.png",
    image128: "/images/jack-the-dealer-128.png",
    image64: "/images/jack-the-dealer-64.png",
    image32: "/images/jack-the-dealer-32.png",
  },
  assets: {
    cardBack: "/images/card-room/card-back.png",
    cardBack80: "/images/card-room/card-back-80.png",
    cardBack48: "/images/card-room/card-back-48.png",
    felt: "/images/card-room/patterns/felt.png",
    chips: {
      "1k": "/images/card-room/chips/1k-48.png",
      "5k": "/images/card-room/chips/5k-48.png",
      "25k": "/images/card-room/chips/25k-48.png",
      "100k": "/images/card-room/chips/100k-48.png",
      "600k": "/images/card-room/chips/600k-48.png",
    } as const,
  },
  /**
   * Brand book panel 09:
   * Display = Golden Nugget (web: Cinzel Decorative stand-in)
   * Subhead/UI = Raleway Semibold
   * Body = Inter Regular
   */
  fonts: {
    display: "var(--font-cr-display), 'Cinzel Decorative', Georgia, serif",
    ui: "var(--font-cr-ui), Raleway, system-ui, sans-serif",
    body: "var(--font-inter), Inter, system-ui, sans-serif",
    pixel: "var(--font-pixel)",
  },
  experienceSteps: [
    {
      id: "build",
      n: "1",
      title: "Build",
      blurb: "Create and customize your AI agent.",
    },
    {
      id: "enter",
      n: "2",
      title: "Enter",
      blurb: "Join tournaments and cash games.",
    },
    {
      id: "watch",
      n: "3",
      title: "Watch",
      blurb: "Live matches. Real time.",
    },
    {
      id: "back",
      n: "4",
      title: "Back",
      blurb: "Bet on other agents to win.",
    },
  ] as const,
  dos: [
    "Use approved colors and fonts",
    "Keep the look calm and premium",
    "Use real textures (felt, wood, brass)",
    "Make information clear and readable",
    "Show confidence, not hype",
    "Respect the casino aesthetic",
    "Maintain consistency across all touchpoints",
  ],
  donts: [
    "Don't use bright neon colors",
    "Don't overuse gradients or glow",
    "Don't clutter the UI",
    "Don't use cartoonish elements",
    "Don't break the premium feel",
    "Don't use unapproved patterns",
    "Don't make unrealistic promises",
  ],
} as const;

/** Card Room color system — Brand Book v1.0 panel 08 */
export const cardRoomColors = {
  primary: {
    emeraldDeep: "#0E2B1E",
    emeraldFelt: "#1F4D33",
    brass: "#BFA64A",
    ivory: "#E8D9A6",
    nearBlack: "#1A1A18",
  },
  secondary: {
    goldBright: "#F4C542",
    success: "#22C55E",
    danger: "#F6686B",
    burgundy: "#4B1E16",
    void: "#0B0C0F",
  },
} as const;

export type CardRoomColorToken =
  | keyof typeof cardRoomColors.primary
  | keyof typeof cardRoomColors.secondary;

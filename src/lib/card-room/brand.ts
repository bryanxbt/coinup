/**
 * CoinUp Card Room brand tokens.
 * Visual source: Card Room Brand Book v1.0 (May 2025)
 * Distinct from the arcade main floor (`src/lib/brand.ts`).
 */

export const CARD_ROOM = {
  name: "CoinUp Card Room",
  /** Public name for the games lobby */
  pitName: "The Pit",
  managedBy: "Jack the Dealer",
  tagline: "AI. Strategy. Confidence.",
  heroLine: "Take a Seat. Trust the Cards.",
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
    /** Pixel portrait — nearest-neighbor scale */
    image: "/images/jack-the-dealer.png",
    image256: "/images/jack-the-dealer-256.png",
    image128: "/images/jack-the-dealer-128.png",
  },
  fonts: {
    /** Brand book: Golden Nugget — we use Cinzel as licensed web stand-in */
    display: "var(--font-cr-display), Georgia, serif",
    ui: "var(--font-cr-ui), system-ui, sans-serif", // Raleway Semibold
    body: "var(--font-inter), system-ui, sans-serif",
    pixel: "var(--font-pixel)", // game surfaces only
  },
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

/** Card Room color system — Brand Book v1.0 */
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

/**
 * Card Room game catalog — arena-style entries (not dev.fun visuals).
 * Currency is always sats; live tables are Texas Hold'em MVP.
 */

export type GameModeId =
  | "holdem-cash"
  | "holdem-tournament"
  | "blackjack"
  | "baccarat"
  | "coin-flip";

export type GameStatus = "live" | "coming_soon";

export interface GameRulesSpec {
  startingStack?: string;
  tableSize?: string;
  blinds?: string;
  actionTimeout?: string;
  minStack?: string;
  maxTables?: string;
  buyIn?: string;
  body: string[];
  chipRules?: string[];
  season?: string[];
}

export interface CardRoomGame {
  id: GameModeId;
  title: string;
  shortTitle: string;
  tag: string;
  status: GameStatus;
  blurb: string;
  overview: string;
  /** Live tables use this filter on API `game` field */
  tableGame?: "texas-holdem";
  /** Default table config hints for create */
  defaults?: {
    sbSats: number;
    bbSats: number;
    maxSeats: number;
    minBuyIn: number;
    maxBuyIn: number;
    actionTimeoutMs?: number;
  };
  rules: GameRulesSpec;
  featured?: boolean;
}

export const CARD_ROOM_GAMES: CardRoomGame[] = [
  {
    id: "holdem-cash",
    title: "Texas Hold'em · Cash",
    shortTitle: "Hold'em Cash",
    tag: "LIVE",
    status: "live",
    featured: true,
    blurb:
      "No-limit cash tables. Seat an agent with sats buy-in. Stacks carry between hands until you cash out.",
    overview:
      "The classic. Outsmart every opponent at the felt. Build your own agent or seat a house guided bot — watch decisions live, climb leaderboards by profit.",
    tableGame: "texas-holdem",
    defaults: {
      sbSats: 50,
      bbSats: 100,
      maxSeats: 6,
      minBuyIn: 2_000,
      maxBuyIn: 10_000,
      actionTimeoutMs: 30_000,
    },
    rules: {
      startingStack: "Buy-in (sats)",
      tableSize: "2 – 6",
      blinds: "50 / 100",
      actionTimeout: "30s",
      minStack: "Buy-in min",
      maxTables: "Open floor",
      buyIn: "2,000 – 10,000 sats",
      body: [
        "Each agent buys in for a chosen stack within table min/max (integer sats).",
        "Tables seat 2–6 agents. A hand starts when at least 2 are seated.",
        "Blinds: small 50, big 100 (demo defaults).",
        "Each action has a 30-second clock. Timeout checks if free, otherwise folds.",
        "Winnings stay in stack until you cash out to available ledger balance.",
      ],
      chipRules: [
        "All amounts are integer satoshis on the Card Room server ledger.",
        "Buy-in locks sats; cash-out returns stack (P/L applied).",
        "Mock faucet is demo only — not withdrawable BTC until Arch wallet bind.",
      ],
      season: [
        "Cash tables run continuously while the floor is open.",
        "Leaderboards rank agents by table profit, wins, and win rate.",
      ],
    },
  },
  {
    id: "holdem-tournament",
    title: "Texas Hold'em · Sit & Go",
    shortTitle: "Hold'em SNG",
    tag: "SOON",
    status: "coming_soon",
    blurb:
      "Fixed buy-in, rising blinds, play to a champion. Same NLHE engine — tournament rails next.",
    overview:
      "Agents buy in once for a fixed stack and compete until one remains. Designed like a classic sit & go — live on the roadmap after cash tables stabilize.",
    tableGame: "texas-holdem",
    rules: {
      startingStack: "1,000 chips (planned)",
      tableSize: "2 – 6",
      blinds: "Rising",
      actionTimeout: "20s",
      body: [
        "Each agent receives a fixed starting stack upon registration.",
        "Tables seat 2–6. Countdown when full; play until champion.",
        "Blind levels increase on a schedule.",
        "Timeout defaults to check if possible, else fold.",
      ],
      chipRules: [
        "Entry fee locked in sats; prize pool paid to finishers (planned).",
      ],
      season: ["Coming soon — not open for registration yet."],
    },
  },
  {
    id: "blackjack",
    title: "Blackjack",
    shortTitle: "Blackjack",
    tag: "SOON",
    status: "coming_soon",
    blurb: "Dealer vs 100 agents. Beat the house strategy.",
    overview: "Multi-agent blackjack against Jack's shoe. Architecture-ready; engine next.",
    rules: {
      body: ["Coming soon."],
    },
  },
  {
    id: "baccarat",
    title: "Baccarat",
    shortTitle: "Baccarat",
    tag: "SOON",
    status: "coming_soon",
    blurb: "Banker, Player, or Tie — strategy meets odds.",
    overview: "Coming soon.",
    rules: { body: ["Coming soon."] },
  },
  {
    id: "coin-flip",
    title: "Coin Flip",
    shortTitle: "Coin Flip",
    tag: "SOON",
    status: "coming_soon",
    blurb: "Heads or tails. Trust your agent.",
    overview: "Coming soon.",
    rules: { body: ["Coming soon."] },
  },
];

export function getGame(id: string): CardRoomGame | undefined {
  return CARD_ROOM_GAMES.find((g) => g.id === id);
}

export function liveGames(): CardRoomGame[] {
  return CARD_ROOM_GAMES.filter((g) => g.status === "live");
}

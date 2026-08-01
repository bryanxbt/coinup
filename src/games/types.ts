import type { ComponentType } from "react";

/** Cost and rewards always in integer satoshis. */
export type Sats = number;

export type GameStatus = "playable" | "coming_soon" | "maintenance";

export type GameCategory =
  | "classic"
  | "skill"
  | "reflex"
  | "puzzle"
  | "multiplayer";

export interface GameMeta {
  id: string;
  title: string;
  tagline: string;
  description: string;
  costSats: Sats;
  /** Soft estimate for a typical run length (seconds). */
  avgSessionSec: number;
  category: GameCategory;
  status: GameStatus;
  /** Neon accent for the cabinet card. */
  accent: string;
  /** Single emoji / glyph for v0 art. */
  glyph: string;
  controls: string[];
  highScoreLabel?: string;
  /** 1 = solo cabinet, 2 = needs a live opponent */
  players?: 1 | 2;
  /** Winner pot = entry × players when both paid (v0 mock). */
  potSats?: Sats;
  /**
   * External play portal (e.g. $SOLE Dodgeball on sole site).
   * When set, cabinet links out instead of /play/[id].
   */
  externalUrl?: string;
}

export interface GameSession {
  gameId: string;
  sessionId: string;
  creditsSpent: Sats;
  startedAt: number;
}

export interface GameScorePayload {
  gameId: string;
  sessionId: string;
  score: number;
  meta?: Record<string, string | number | boolean>;
}

export interface GamePlayProps {
  session: GameSession;
  onScore: (payload: GameScorePayload) => void;
  onExit: () => void;
}

export interface GameModule {
  meta: GameMeta;
  Play: ComponentType<GamePlayProps>;
}

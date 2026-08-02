export type AgentMode = "guided" | "skill";

export type AgentStatus = "online" | "offline" | "seated" | "archived";

export type RiskProfile = "tight" | "balanced" | "loose";
export type Aggression = "passive" | "standard" | "aggressive";

/** Guided strategy knobs (host deterministic policy in PR 8). */
export interface GuidedStrategy {
  tightness: number; // 0–100
  aggression: number; // 0–100
  bluffFrequency: number; // 0–100
  preferredGames: string[];
  notes?: string;
}

export interface AgentRecord {
  id: string;
  ownerPlayerId: string;
  name: string;
  handle: string;
  mode: AgentMode;
  status: AgentStatus;
  avatarSeed: string;
  strategy: GuidedStrategy;
  /** Hashed; plaintext only returned once on create/rotate */
  apiKeyHash: string;
  apiKeyPrefix: string;
  createdAt: string;
  updatedAt: string;
  lastHeartbeatAt: string | null;
  heartbeatVersion: string | null;
  gamesPlayed: number;
  wins: number;
  /** Active table if seated (PR 6+) */
  seatedTableId: string | null;
}

export interface AgentPublic {
  id: string;
  ownerPlayerId: string;
  name: string;
  handle: string;
  mode: AgentMode;
  status: AgentStatus;
  avatarSeed: string;
  strategy: GuidedStrategy;
  createdAt: string;
  lastHeartbeatAt: string | null;
  gamesPlayed: number;
  wins: number;
  winRate: number | null;
  seatedTableId: string | null;
}

export function toPublic(a: AgentRecord): AgentPublic {
  return {
    id: a.id,
    ownerPlayerId: a.ownerPlayerId,
    name: a.name,
    handle: a.handle,
    mode: a.mode,
    status: a.status,
    avatarSeed: a.avatarSeed,
    strategy: a.strategy,
    createdAt: a.createdAt,
    lastHeartbeatAt: a.lastHeartbeatAt,
    gamesPlayed: a.gamesPlayed,
    wins: a.wins,
    winRate:
      a.gamesPlayed > 0
        ? Math.round((a.wins / a.gamesPlayed) * 1000) / 10
        : null,
    seatedTableId: a.seatedTableId,
  };
}

export const DEFAULT_STRATEGY: GuidedStrategy = {
  tightness: 55,
  aggression: 45,
  bluffFrequency: 20,
  preferredGames: ["texas-holdem"],
};

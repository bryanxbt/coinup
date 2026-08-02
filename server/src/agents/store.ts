import { createHash, randomBytes, randomUUID } from "node:crypto";
import type {
  AgentMode,
  AgentRecord,
  AgentStatus,
  GuidedStrategy,
} from "./types.js";
import { DEFAULT_STRATEGY } from "./types.js";

const HEARTBEAT_TTL_MS = 60_000;

const agents = new Map<string, AgentRecord>();
/** apiKeyHash → agentId */
const keyIndex = new Map<string, string>();
/** handle lowercase → agentId */
const handleIndex = new Map<string, string>();

function nowIso(): string {
  return new Date().toISOString();
}

function hashKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

function mintApiKey(): { apiKey: string; hash: string; prefix: string } {
  const apiKey = `cr_agent_${randomBytes(24).toString("base64url")}`;
  return {
    apiKey,
    hash: hashKey(apiKey),
    prefix: apiKey.slice(0, 16) + "…",
  };
}

function slugHandle(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
  return base || "agent";
}

function uniqueHandle(name: string): string {
  let handle = slugHandle(name);
  let n = 0;
  while (handleIndex.has(handle)) {
    n += 1;
    handle = `${slugHandle(name)}_${n}`.slice(0, 30);
  }
  return handle;
}

export class AgentError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AgentError";
  }
}

export function createAgent(opts: {
  ownerPlayerId: string;
  name: string;
  mode?: AgentMode;
  strategy?: Partial<GuidedStrategy>;
}): { agent: AgentRecord; apiKey: string } {
  const name = opts.name.trim().slice(0, 48);
  if (name.length < 2) {
    throw new AgentError("invalid_name", 400, "name must be at least 2 characters");
  }
  const mode: AgentMode = opts.mode === "skill" ? "skill" : "guided";
  const { apiKey, hash, prefix } = mintApiKey();
  const handle = uniqueHandle(name);
  const id = `agt_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const ts = nowIso();
  const agent: AgentRecord = {
    id,
    ownerPlayerId: opts.ownerPlayerId,
    name,
    handle,
    mode,
    status: "offline",
    avatarSeed: handle,
    strategy: { ...DEFAULT_STRATEGY, ...opts.strategy },
    apiKeyHash: hash,
    apiKeyPrefix: prefix,
    createdAt: ts,
    updatedAt: ts,
    lastHeartbeatAt: null,
    heartbeatVersion: null,
    gamesPlayed: 0,
    wins: 0,
    seatedTableId: null,
  };
  agents.set(id, agent);
  keyIndex.set(hash, id);
  handleIndex.set(handle, id);
  return { agent, apiKey };
}

export function listByOwner(ownerPlayerId: string): AgentRecord[] {
  return [...agents.values()]
    .filter((a) => a.ownerPlayerId === ownerPlayerId && a.status !== "archived")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAgent(id: string): AgentRecord | undefined {
  return agents.get(id);
}

export function getAgentByApiKey(apiKey: string): AgentRecord | null {
  const id = keyIndex.get(hashKey(apiKey));
  if (!id) return null;
  const a = agents.get(id);
  if (!a || a.status === "archived") return null;
  refreshOnlineStatus(a);
  return a;
}

export function getPublicAgent(id: string): AgentRecord | undefined {
  const a = agents.get(id);
  if (!a || a.status === "archived") return undefined;
  refreshOnlineStatus(a);
  return a;
}

export function listDiscover(limit = 50): AgentRecord[] {
  return [...agents.values()]
    .filter((a) => a.status !== "archived")
    .map((a) => {
      refreshOnlineStatus(a);
      return a;
    })
    .sort(
      (a, b) =>
        b.gamesPlayed - a.gamesPlayed ||
        b.wins - a.wins ||
        b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, limit);
}

/** After a hand settles — count games; win if stack increased. */
export function recordHandParticipation(
  seats: Array<{ agentId: string; stackStartSats: number; stackEndSats: number }>,
): void {
  for (const s of seats) {
    const a = agents.get(s.agentId);
    if (!a || a.status === "archived") continue;
    a.gamesPlayed += 1;
    if (s.stackEndSats > s.stackStartSats) {
      a.wins += 1;
    }
    a.updatedAt = nowIso();
  }
}

export type LeaderboardRow = {
  rank: number;
  agentId: string;
  name: string;
  handle: string;
  mode: AgentMode;
  status: AgentStatus;
  gamesPlayed: number;
  wins: number;
  winRate: number | null;
  profitSats: number;
};

/**
 * Leaderboard from agent counters + optional profit map (from history).
 */
export function buildLeaderboard(
  profitByAgent: Map<string, number>,
  limit = 50,
): LeaderboardRow[] {
  const rows = [...agents.values()]
    .filter((a) => a.status !== "archived" && a.gamesPlayed > 0)
    .map((a) => {
      refreshOnlineStatus(a);
      return {
        agentId: a.id,
        name: a.name,
        handle: a.handle,
        mode: a.mode,
        status: a.status,
        gamesPlayed: a.gamesPlayed,
        wins: a.wins,
        winRate:
          a.gamesPlayed > 0
            ? Math.round((a.wins / a.gamesPlayed) * 1000) / 10
            : null,
        profitSats: profitByAgent.get(a.id) ?? 0,
      };
    })
    .sort(
      (a, b) =>
        b.profitSats - a.profitSats ||
        b.wins - a.wins ||
        b.gamesPlayed - a.gamesPlayed,
    )
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return rows;
}

function refreshOnlineStatus(a: AgentRecord): void {
  if (a.status === "seated" || a.status === "archived") return;
  if (!a.lastHeartbeatAt) {
    a.status = "offline";
    return;
  }
  const age = Date.now() - Date.parse(a.lastHeartbeatAt);
  a.status = age <= HEARTBEAT_TTL_MS ? "online" : "offline";
}

export function updateAgent(
  id: string,
  ownerPlayerId: string,
  patch: {
    name?: string;
    strategy?: Partial<GuidedStrategy>;
    mode?: AgentMode;
  },
): AgentRecord {
  const a = agents.get(id);
  if (!a || a.status === "archived") {
    throw new AgentError("not_found", 404, "agent not found");
  }
  if (a.ownerPlayerId !== ownerPlayerId) {
    throw new AgentError("forbidden", 403, "not your agent");
  }
  if (patch.name !== undefined) {
    const name = patch.name.trim().slice(0, 48);
    if (name.length < 2) {
      throw new AgentError("invalid_name", 400, "name too short");
    }
    a.name = name;
  }
  if (patch.mode === "guided" || patch.mode === "skill") {
    a.mode = patch.mode;
  }
  if (patch.strategy) {
    a.strategy = { ...a.strategy, ...patch.strategy };
  }
  a.updatedAt = nowIso();
  return a;
}

export function archiveAgent(id: string, ownerPlayerId: string): void {
  const a = agents.get(id);
  if (!a || a.status === "archived") {
    throw new AgentError("not_found", 404, "agent not found");
  }
  if (a.ownerPlayerId !== ownerPlayerId) {
    throw new AgentError("forbidden", 403, "not your agent");
  }
  if (a.seatedTableId) {
    throw new AgentError("agent_seated", 409, "cash out before archiving");
  }
  keyIndex.delete(a.apiKeyHash);
  handleIndex.delete(a.handle);
  a.status = "archived";
  a.updatedAt = nowIso();
}

export function rotateApiKey(
  id: string,
  ownerPlayerId: string,
): { agent: AgentRecord; apiKey: string } {
  const a = agents.get(id);
  if (!a || a.status === "archived") {
    throw new AgentError("not_found", 404, "agent not found");
  }
  if (a.ownerPlayerId !== ownerPlayerId) {
    throw new AgentError("forbidden", 403, "not your agent");
  }
  keyIndex.delete(a.apiKeyHash);
  const { apiKey, hash, prefix } = mintApiKey();
  a.apiKeyHash = hash;
  a.apiKeyPrefix = prefix;
  a.updatedAt = nowIso();
  keyIndex.set(hash, id);
  return { agent: a, apiKey };
}

export function heartbeat(
  agent: AgentRecord,
  opts: { status?: string; version?: string },
): AgentRecord {
  agent.lastHeartbeatAt = nowIso();
  agent.heartbeatVersion = opts.version ?? agent.heartbeatVersion;
  if (agent.seatedTableId) {
    agent.status = "seated";
  } else {
    agent.status = "online";
  }
  agent.updatedAt = agent.lastHeartbeatAt;
  return agent;
}

/** Seat / unseat for table service (MVP one table per agent). */
export function setAgentSeated(
  agentId: string,
  tableId: string | null,
): AgentRecord {
  const a = agents.get(agentId);
  if (!a || a.status === "archived") {
    throw new AgentError("not_found", 404, "agent not found");
  }
  if (tableId && a.seatedTableId && a.seatedTableId !== tableId) {
    throw new AgentError("agent_seated", 409, "agent already at another table");
  }
  a.seatedTableId = tableId;
  a.status = tableId ? "seated" : a.lastHeartbeatAt ? "online" : "offline";
  a.updatedAt = nowIso();
  return a;
}

export function resetAgentsForTests(): void {
  agents.clear();
  keyIndex.clear();
  handleIndex.clear();
}

export { HEARTBEAT_TTL_MS };

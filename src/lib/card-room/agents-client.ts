/**
 * Human-facing agents API (session bearer).
 */

import { formatApiError } from "./api-errors";
import { apiBaseUrl, ensureRuntimeConfig } from "./runtime-config";
import { ensureSession, getSessionToken } from "./session";

function apiBase(): string {
  return apiBaseUrl();
}

export type AgentPublic = {
  id: string;
  ownerPlayerId: string;
  name: string;
  handle: string;
  mode: "guided" | "skill";
  status: "online" | "offline" | "seated" | "archived";
  avatarSeed: string;
  strategy: {
    tightness: number;
    aggression: number;
    bluffFrequency: number;
    preferredGames: string[];
    notes?: string;
  };
  createdAt: string;
  lastHeartbeatAt: string | null;
  gamesPlayed: number;
  wins: number;
  winRate: number | null;
  seatedTableId: string | null;
};

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    await ensureRuntimeConfig();
    await ensureSession();
    const token = getSessionToken();
    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error(
        typeof body.message === "string"
          ? body.message
          : `HTTP ${res.status}`,
      );
    }
    return body as T;
  } catch (err) {
    throw new Error(formatApiError(err));
  }
}

export async function listMyAgents(): Promise<AgentPublic[]> {
  const data = await authFetch<{ agents: AgentPublic[] }>("/v1/agents");
  return data.agents;
}

export async function createAgent(input: {
  name: string;
  mode: "guided" | "skill";
  strategy?: Partial<AgentPublic["strategy"]>;
}): Promise<{ agent: AgentPublic; apiKey: string; warning: string }> {
  return authFetch("/v1/agents", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function archiveAgent(id: string): Promise<void> {
  await authFetch(`/v1/agents/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function rotateAgentKey(
  id: string,
): Promise<{ agent: AgentPublic; apiKey: string; warning: string }> {
  return authFetch(`/v1/agents/${encodeURIComponent(id)}/rotate-key`, {
    method: "POST",
  });
}

export async function discoverAgents(limit = 20): Promise<AgentPublic[]> {
  await ensureRuntimeConfig();
  const res = await fetch(
    `${apiBase()}/v1/agents/discover?limit=${limit}`,
  );
  const data = (await res.json()) as { agents: AgentPublic[] };
  if (!res.ok) throw new Error("discover failed");
  return data.agents;
}

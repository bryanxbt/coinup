function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_CR_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8787"
  );
}

export type DiscoverAgent = {
  id: string;
  ownerPlayerId: string;
  name: string;
  handle: string;
  mode: "guided" | "skill";
  status: string;
  gamesPlayed: number;
  wins: number;
  winRate: number | null;
  strategy: {
    tightness: number;
    aggression: number;
    bluffFrequency: number;
  };
  createdAt: string;
};

export type LeaderboardRow = {
  rank: number;
  agentId: string;
  name: string;
  handle: string;
  mode: string;
  status: string;
  gamesPlayed: number;
  wins: number;
  winRate: number | null;
  profitSats: number;
};

export async function fetchDiscover(opts?: {
  q?: string;
  limit?: number;
}): Promise<DiscoverAgent[]> {
  const params = new URLSearchParams();
  if (opts?.q) params.set("q", opts.q);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const res = await fetch(`${apiBase()}/v1/discover?${params}`);
  if (!res.ok) throw new Error("discover failed");
  const data = (await res.json()) as { agents: DiscoverAgent[] };
  return data.agents;
}

export async function fetchLeaderboard(opts?: {
  sort?: "profit" | "wins" | "winrate";
  limit?: number;
}): Promise<{ rows: LeaderboardRow[]; sort: string; updatedAt: string }> {
  const params = new URLSearchParams();
  if (opts?.sort) params.set("sort", opts.sort);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const res = await fetch(`${apiBase()}/v1/leaderboards?${params}`);
  if (!res.ok) throw new Error("leaderboard failed");
  return res.json() as Promise<{
    rows: LeaderboardRow[];
    sort: string;
    updatedAt: string;
  }>;
}

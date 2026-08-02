function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_CR_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8787"
  );
}

export type HandHistory = {
  id: string;
  tableId: string;
  tableName: string;
  handNumber: number;
  handId: string;
  seedCommit: string;
  seedReveal: number | null;
  streetEnded: string;
  board: string[];
  potSats: number;
  seats: Array<{
    seatNo: number;
    agentId: string;
    stackStartSats: number;
    stackEndSats: number;
    hasFolded: boolean;
  }>;
  result: unknown;
  finishedAt: string;
  startedAt: string;
  verified: boolean | null;
};

export type OfficeRules = {
  commissioner: string;
  currency: string;
  chain: string;
  rules: string[];
  fairness: {
    model: string;
    commit: string;
    reveal: string;
    verify: string;
  };
};

export async function fetchOfficeRules(): Promise<OfficeRules> {
  const res = await fetch(`${apiBase()}/v1/office/rules`);
  if (!res.ok) throw new Error("office rules failed");
  return res.json() as Promise<OfficeRules>;
}

export async function fetchHistory(limit = 40): Promise<HandHistory[]> {
  const res = await fetch(`${apiBase()}/v1/history?limit=${limit}`);
  if (!res.ok) throw new Error("history failed");
  const data = (await res.json()) as { hands: HandHistory[] };
  return data.hands;
}

export async function fetchHand(id: string): Promise<HandHistory> {
  const res = await fetch(
    `${apiBase()}/v1/history/${encodeURIComponent(id)}`,
  );
  if (!res.ok) throw new Error("hand not found");
  const data = (await res.json()) as { hand: HandHistory };
  return data.hand;
}

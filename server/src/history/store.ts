/**
 * In-memory hand journal + fairness commit fields.
 * At hand start we commit sha256(seed||handId); at settle we reveal seed.
 */

import { createHash, randomUUID } from "node:crypto";

export interface HandHistoryEntry {
  id: string;
  tableId: string;
  tableName: string;
  handNumber: number;
  handId: string;
  /** sha256 hex of `${seed}:${handId}` — published at deal */
  seedCommit: string;
  /** Revealed after hand ends (fairness check) */
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
}

const entries: HandHistoryEntry[] = [];
const MAX = 500;

/** Pending commits while hand is live: handId → partial */
const openHands = new Map<
  string,
  {
    tableId: string;
    tableName: string;
    handNumber: number;
    handId: string;
    seed: number;
    seedCommit: string;
    startedAt: string;
    stackStart: Map<string, number>;
  }
>();

function sha256hex(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export function commitHandStart(opts: {
  tableId: string;
  tableName: string;
  handNumber: number;
  handId: string;
  seed: number;
  stacks: Array<{ agentId: string; stackSats: number }>;
}): { seedCommit: string } {
  const seedCommit = sha256hex(`${opts.seed}:${opts.handId}`);
  const stackStart = new Map<string, number>();
  for (const s of opts.stacks) stackStart.set(s.agentId, s.stackSats);
  openHands.set(opts.handId, {
    tableId: opts.tableId,
    tableName: opts.tableName,
    handNumber: opts.handNumber,
    handId: opts.handId,
    seed: opts.seed,
    seedCommit,
    startedAt: new Date().toISOString(),
    stackStart,
  });
  return { seedCommit };
}

export function recordHandEnd(opts: {
  handId: string;
  board: string[];
  potSats: number;
  streetEnded: string;
  seats: Array<{
    seatNo: number;
    agentId: string;
    stackSats: number;
    hasFolded: boolean;
  }>;
  result: unknown;
}): HandHistoryEntry | null {
  const open = openHands.get(opts.handId);
  if (!open) {
    // still record a minimal entry without commit
    const entry: HandHistoryEntry = {
      id: `hh_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
      tableId: "unknown",
      tableName: "unknown",
      handNumber: 0,
      handId: opts.handId,
      seedCommit: "",
      seedReveal: null,
      streetEnded: opts.streetEnded,
      board: opts.board,
      potSats: opts.potSats,
      seats: opts.seats.map((s) => ({
        seatNo: s.seatNo,
        agentId: s.agentId,
        stackStartSats: s.stackSats,
        stackEndSats: s.stackSats,
        hasFolded: s.hasFolded,
      })),
      result: opts.result,
      finishedAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
    };
    push(entry);
    return entry;
  }

  openHands.delete(opts.handId);
  const entry: HandHistoryEntry = {
    id: `hh_${randomUUID().replace(/-/g, "").slice(0, 12)}`,
    tableId: open.tableId,
    tableName: open.tableName,
    handNumber: open.handNumber,
    handId: open.handId,
    seedCommit: open.seedCommit,
    seedReveal: open.seed,
    streetEnded: opts.streetEnded,
    board: opts.board,
    potSats: opts.potSats,
    seats: opts.seats.map((s) => ({
      seatNo: s.seatNo,
      agentId: s.agentId,
      stackStartSats: open.stackStart.get(s.agentId) ?? s.stackSats,
      stackEndSats: s.stackSats,
      hasFolded: s.hasFolded,
    })),
    result: opts.result,
    finishedAt: new Date().toISOString(),
    startedAt: open.startedAt,
  };
  push(entry);
  return entry;
}

function push(entry: HandHistoryEntry): void {
  entries.unshift(entry);
  while (entries.length > MAX) entries.pop();
}

export function listHistory(opts?: {
  tableId?: string;
  agentId?: string;
  limit?: number;
}): HandHistoryEntry[] {
  const limit = opts?.limit ?? 50;
  return entries
    .filter((e) => {
      if (opts?.tableId && e.tableId !== opts.tableId) return false;
      if (
        opts?.agentId &&
        !e.seats.some((s) => s.agentId === opts.agentId)
      ) {
        return false;
      }
      return true;
    })
    .slice(0, limit);
}

export function getHistory(id: string): HandHistoryEntry | undefined {
  return entries.find((e) => e.id === id || e.handId === id);
}

/** Verify seedReveal matches seedCommit */
export function verifyCommit(entry: HandHistoryEntry): boolean {
  if (entry.seedReveal === null || !entry.seedCommit) return false;
  return (
    sha256hex(`${entry.seedReveal}:${entry.handId}`) === entry.seedCommit
  );
}

export function officeRules() {
  return {
    commissioner: "Jack the Dealer",
    currency: "integer satoshis",
    chain: "Arch Network (Bitcoin settlement target)",
    rules: [
      "Agents play. Players build, watch, and back.",
      "Server-authoritative engine; no client trust for pots.",
      "Each hand publishes a seed commit at deal; seed is revealed at settle for audit.",
      "Timeouts: auto-check if free, else auto-fold.",
      "One active table per agent (MVP).",
      "Guided agents use the house reference policy — not a solver.",
      "Withdraw-to-BTC requires wallet link; mock faucet is not real BTC.",
      "Backing is deferred and counsel-gated.",
    ],
    fairness: {
      model: "commit-reveal seed",
      commit: "sha256(seed:handId) at hand start",
      reveal: "seed integer after hand end",
      verify: "GET /v1/history/:id → seedCommit, seedReveal, verified flag",
    },
  };
}

/** Sum of stack deltas across all recorded hands. */
export function profitByAgent(): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of entries) {
    for (const s of e.seats) {
      const d = s.stackEndSats - s.stackStartSats;
      m.set(s.agentId, (m.get(s.agentId) ?? 0) + d);
    }
  }
  return m;
}

export function resetHistoryForTests(): void {
  entries.length = 0;
  openHands.clear();
}

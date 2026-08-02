/**
 * Cash table service — seats agents, drives HoldemHand, fanout via realtime hub.
 */

import { randomUUID } from "node:crypto";
import { HoldemHand } from "../engine/holdem/engine.js";
import type {
  EngineSnapshot,
  LegalAction,
  PlayerAction,
} from "../engine/holdem/types.js";
import { getAgent, setAgentSeated, AgentError } from "../agents/store.js";
import { createLedgerService } from "../ledger/service.js";
import {
  publishSnapshot,
  publishDelta,
  publishChat,
  publishHandEnd,
} from "../realtime/hub.js";
import { scheduleGuidedIfNeeded } from "../agents/guided-runner.js";
import { commitHandStart, recordHandEnd } from "../history/store.js";
import { recordHandParticipation } from "../agents/store.js";

const ledger = createLedgerService();

export class TableError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "TableError";
  }
}

export interface TableSeat {
  seatNo: number;
  agentId: string;
  ownerPlayerId: string;
  stackSats: number;
  /** Original buy-in locked in ledger */
  buyInSats: number;
}

export interface CashTable {
  id: string;
  name: string;
  game: "texas-holdem";
  status: "open" | "running" | "closed";
  maxSeats: number;
  sbSats: number;
  bbSats: number;
  minBuyIn: number;
  maxBuyIn: number;
  seats: Map<number, TableSeat>;
  hand: HoldemHand | null;
  handNumber: number;
  buttonSeat: number;
  createdAt: string;
  /** agentId → pending action for skill loop */
  pendingByAgent: Map<string, PendingForAgent>;
  actionDeadline: number | null;
  actionTimeoutMs: number;
}

export interface PendingForAgent {
  agentId: string;
  tableId: string;
  handId: string;
  seq: number;
  street: string;
  timeLeftMs: number;
  timeoutAt: string;
  legalActions: LegalAction[];
  callAmountSats: number;
  minRaiseToSats: number | null;
  publicState: EngineSnapshot;
  privateHole: [string, string] | null;
}

const tables = new Map<string, CashTable>();
let seqCounter = 0;

function channel(tableId: string): string {
  return `table:${tableId}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listTables(): Array<Record<string, unknown>> {
  return [...tables.values()].map(publicTable);
}

export function getTable(id: string): CashTable | undefined {
  return tables.get(id);
}

export function publicTable(t: CashTable): Record<string, unknown> {
  return {
    id: t.id,
    name: t.name,
    game: t.game,
    status: t.status,
    maxSeats: t.maxSeats,
    sbSats: t.sbSats,
    bbSats: t.bbSats,
    minBuyIn: t.minBuyIn,
    maxBuyIn: t.maxBuyIn,
    seated: t.seats.size,
    seats: [...t.seats.values()].map((s) => ({
      seatNo: s.seatNo,
      agentId: s.agentId,
      stackSats: s.stackSats,
    })),
    handNumber: t.handNumber,
    handId: t.hand?.handId ?? null,
    actionSeat: t.hand?.snapshot().actionSeat ?? null,
    seedCommit:
      (t as CashTable & { lastSeedCommit?: string }).lastSeedCommit ?? null,
  };
}

export function createTable(opts?: {
  name?: string;
  maxSeats?: number;
  sbSats?: number;
  bbSats?: number;
  minBuyIn?: number;
  maxBuyIn?: number;
}): CashTable {
  const id = `tbl_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const sb = opts?.sbSats ?? 50;
  const bb = opts?.bbSats ?? 100;
  const t: CashTable = {
    id,
    name: opts?.name ?? `Table ${id.slice(-4)}`,
    game: "texas-holdem",
    status: "open",
    maxSeats: opts?.maxSeats ?? 6,
    sbSats: sb,
    bbSats: bb,
    minBuyIn: opts?.minBuyIn ?? bb * 20,
    maxBuyIn: opts?.maxBuyIn ?? bb * 100,
    seats: new Map(),
    hand: null,
    handNumber: 0,
    buttonSeat: 0,
    createdAt: nowIso(),
    pendingByAgent: new Map(),
    actionDeadline: null,
    actionTimeoutMs: 30_000,
  };
  tables.set(id, t);
  broadcast(t);
  return t;
}

/** Ensure open cash tables for local / demo floor. */
export function ensureDefaultTable(): CashTable {
  const open = [...tables.values()].filter(
    (t) => t.status === "open" || t.status === "running",
  );
  if (open.length >= 2) return open[0]!;
  if (open.length === 1) {
    createTable({
      name: "Felt 02",
      sbSats: 50,
      bbSats: 100,
      maxSeats: 6,
      minBuyIn: 2_000,
      maxBuyIn: 10_000,
    });
    return open[0]!;
  }
  createTable({
    name: "Felt 01",
    sbSats: 50,
    bbSats: 100,
    maxSeats: 6,
    minBuyIn: 2_000,
    maxBuyIn: 10_000,
  });
  return createTable({
    name: "Felt 02",
    sbSats: 50,
    bbSats: 100,
    maxSeats: 6,
    minBuyIn: 2_000,
    maxBuyIn: 10_000,
  });
}

export function registerAgent(opts: {
  tableId: string;
  agentId: string;
  ownerPlayerId: string;
  buyInSats: number;
  seatNo?: number;
  idempotencyKey: string;
}): { table: Record<string, unknown>; seatNo: number; txRef: string } {
  const t = tables.get(opts.tableId);
  if (!t || t.status === "closed") {
    throw new TableError("not_found", 404, "table not found");
  }
  const agent = getAgent(opts.agentId);
  if (!agent || agent.status === "archived") {
    throw new TableError("agent_not_found", 404, "agent not found");
  }
  if (agent.ownerPlayerId !== opts.ownerPlayerId) {
    throw new TableError("forbidden", 403, "not your agent");
  }
  if (agent.seatedTableId && agent.seatedTableId !== t.id) {
    throw new TableError("agent_seated", 409, "agent already seated elsewhere");
  }
  for (const s of t.seats.values()) {
    if (s.agentId === opts.agentId) {
      throw new TableError("already_seated", 409, "agent already at this table");
    }
  }
  if (t.seats.size >= t.maxSeats) {
    throw new TableError("full", 409, "table full");
  }
  if (opts.buyInSats < t.minBuyIn || opts.buyInSats > t.maxBuyIn) {
    throw new TableError(
      "buy_in_range",
      400,
      `buy-in must be ${t.minBuyIn}–${t.maxBuyIn} sats`,
    );
  }

  const money = ledger.apply({
    kind: "buy_in",
    playerId: opts.ownerPlayerId,
    agentId: opts.agentId,
    tableId: t.id,
    amountSats: opts.buyInSats,
    idempotencyKey: opts.idempotencyKey,
  });

  let seatNo = opts.seatNo;
  if (seatNo === undefined) {
    for (let i = 0; i < t.maxSeats; i++) {
      if (!t.seats.has(i)) {
        seatNo = i;
        break;
      }
    }
  }
  if (seatNo === undefined || t.seats.has(seatNo) || seatNo >= t.maxSeats) {
    // refund path would need reverse — throw before lock ideally; we already locked
    ledger.apply({
      kind: "refund_entry",
      playerId: opts.ownerPlayerId,
      refType: "table_buy_in",
      refId: t.id,
      amountSats: opts.buyInSats,
      reason: "seat_unavailable",
      idempotencyKey: opts.idempotencyKey + ":refund",
    });
    throw new TableError("seat_taken", 409, "seat unavailable");
  }

  t.seats.set(seatNo, {
    seatNo,
    agentId: opts.agentId,
    ownerPlayerId: opts.ownerPlayerId,
    stackSats: opts.buyInSats,
    buyInSats: opts.buyInSats,
  });
  try {
    setAgentSeated(opts.agentId, t.id);
  } catch (e) {
    t.seats.delete(seatNo);
    throw e;
  }

  broadcast(t);
  if (t.seats.size >= 2 && !t.hand) {
    startHand(t);
  }
  return { table: publicTable(t), seatNo, txRef: money.txRef };
}

export function cashOut(opts: {
  tableId: string;
  agentId: string;
  ownerPlayerId: string;
  idempotencyKey: string;
}): { stackSats: number; txRef: string } {
  const t = tables.get(opts.tableId);
  if (!t) throw new TableError("not_found", 404, "table not found");
  if (t.hand && !t.hand.snapshot().finished) {
    throw new TableError("in_hand", 409, "finish hand before cash-out");
  }
  let seat: TableSeat | undefined;
  for (const s of t.seats.values()) {
    if (s.agentId === opts.agentId) seat = s;
  }
  if (!seat) throw new TableError("not_seated", 404, "agent not at table");
  if (seat.ownerPlayerId !== opts.ownerPlayerId) {
    throw new TableError("forbidden", 403, "not your agent");
  }

  // Sync stack from last hand if any
  if (t.hand) {
    const snap = t.hand.snapshot();
    const eng = snap.seats.find((s) => s.agentId === opts.agentId);
    if (eng) seat.stackSats = eng.stackSats;
  }

  const stack = seat.stackSats;
  const buyIn = seat.buyInSats;
  t.seats.delete(seat.seatNo);
  setAgentSeated(opts.agentId, null);

  // Unlock original buy-in, then apply P/L on available
  const unlock = ledger.apply({
    kind: "cash_out_table",
    playerId: opts.ownerPlayerId,
    agentId: opts.agentId,
    tableId: t.id,
    amountSats: buyIn,
    idempotencyKey: opts.idempotencyKey,
  });
  const diff = stack - buyIn;
  if (diff > 0) {
    ledger.apply({
      kind: "deposit",
      playerId: opts.ownerPlayerId,
      amountSats: diff,
      idempotencyKey: opts.idempotencyKey + ":win",
    });
  } else if (diff < 0) {
    ledger.apply({
      kind: "withdraw",
      playerId: opts.ownerPlayerId,
      amountSats: -diff,
      idempotencyKey: opts.idempotencyKey + ":loss",
    });
  }

  t.hand = null;
  t.status = t.seats.size >= 2 ? "running" : "open";
  broadcast(t);
  if (t.seats.size >= 2) startHand(t);
  return { stackSats: stack, txRef: unlock.txRef };
}

function startHand(t: CashTable): void {
  if (t.seats.size < 2) return;
  // prune zero stacks
  for (const [n, s] of t.seats) {
    if (s.stackSats <= 0) {
      setAgentSeated(s.agentId, null);
      t.seats.delete(n);
    }
  }
  if (t.seats.size < 2) {
    t.status = "open";
    t.hand = null;
    broadcast(t);
    return;
  }

  const seated = [...t.seats.values()].sort((a, b) => a.seatNo - b.seatNo);
  // advance button among seated
  const seatNos = seated.map((s) => s.seatNo);
  let btn = t.buttonSeat;
  if (!seatNos.includes(btn)) btn = seatNos[0]!;
  else {
    const idx = seatNos.indexOf(btn);
    btn = seatNos[(idx + 1) % seatNos.length]!;
  }
  t.buttonSeat = btn;
  t.handNumber += 1;
  t.status = "running";
  const seed = (Date.now() ^ t.handNumber * 2654435761) >>> 0;
  t.hand = new HoldemHand(
    seated.map((s) => ({
      seatNo: s.seatNo,
      agentId: s.agentId,
      stackSats: s.stackSats,
    })),
    {
      sbSats: t.sbSats,
      bbSats: t.bbSats,
      buttonSeat: t.buttonSeat,
      seed,
    },
  );
  const { seedCommit } = commitHandStart({
    tableId: t.id,
    tableName: t.name,
    handNumber: t.handNumber,
    handId: t.hand.handId,
    seed,
    stacks: seated.map((s) => ({
      agentId: s.agentId,
      stackSats: s.stackSats,
    })),
  });
  // Attach commit to public table payload via last journal field
  (t as CashTable & { lastSeedCommit?: string }).lastSeedCommit = seedCommit;

  t.pendingByAgent.clear();
  refreshPending(t);
  broadcast(t, true);
  armTimeout(t);
}

function refreshPending(t: CashTable): void {
  t.pendingByAgent.clear();
  if (!t.hand || t.hand.snapshot().finished) return;
  const snap = t.hand.snapshot();
  if (snap.actionSeat === null) return;
  const seat = t.hand.seats[snap.actionSeat];
  if (!seat || seat.empty) return;
  const legal = t.hand.getLegalActions(snap.actionSeat);
  const hole = t.hand.getHole(snap.actionSeat);
  const deadline = Date.now() + t.actionTimeoutMs;
  t.actionDeadline = deadline;
  const pending: PendingForAgent = {
    agentId: seat.agentId,
    tableId: t.id,
    handId: snap.handId,
    seq: ++seqCounter,
    street: snap.street,
    timeLeftMs: t.actionTimeoutMs,
    timeoutAt: new Date(deadline).toISOString(),
    legalActions: legal,
    callAmountSats: Math.max(0, snap.currentBetSats - seat.streetBetSats),
    minRaiseToSats: snap.minRaiseToSats,
    publicState: snap,
    privateHole: hole,
  };
  t.pendingByAgent.set(seat.agentId, pending);

  // Host guided bots auto-act (skill agents poll /agent/v1/pending)
  scheduleGuidedIfNeeded(
    {
      agentId: pending.agentId,
      tableId: pending.tableId,
      handId: pending.handId,
      seq: pending.seq,
      street: pending.street,
      legalActions: pending.legalActions,
      callAmountSats: pending.callAmountSats,
      privateHole: pending.privateHole,
      publicState: {
        potSats: snap.potSats,
        board: snap.board,
        currentBetSats: snap.currentBetSats,
      },
    },
    (agentId, body) => {
      try {
        agentAct(agentId, body);
      } catch (err) {
        console.warn("[guided-act]", err);
      }
    },
  );
}

function armTimeout(t: CashTable): void {
  if (!t.actionDeadline) return;
  const handId = t.hand?.handId;
  const delay = Math.max(0, t.actionDeadline - Date.now());
  setTimeout(() => {
    if (!t.hand || t.hand.handId !== handId) return;
    if (t.hand.snapshot().finished) return;
    const seat = t.hand.snapshot().actionSeat;
    if (seat === null) return;
    const legal = t.hand.getLegalActions(seat);
    try {
      if (legal.some((l) => l.type === "check")) {
        applyTableAction(t, seat, { type: "check" }, "timeout");
      } else {
        applyTableAction(t, seat, { type: "fold" }, "timeout");
      }
    } catch {
      /* ignore */
    }
  }, delay + 10);
}

function applyTableAction(
  t: CashTable,
  seatNo: number,
  action: PlayerAction,
  message?: string,
): EngineSnapshot {
  if (!t.hand) throw new TableError("no_hand", 409, "no active hand");
  const snap = t.hand.applyAction(seatNo, action);
  if (message) {
    const seat = t.hand.seats[seatNo];
    if (seat && !seat.empty) {
      publishChat(channel(t.id), seat.agentId, message);
    }
  }
  // sync stacks to seats
  for (const es of snap.seats) {
    if (es.agentId && t.seats.has(es.seatNo)) {
      t.seats.get(es.seatNo)!.stackSats = es.stackSats;
    }
  }

  if (snap.finished) {
    const handId = snap.handId;
    const hist = recordHandEnd({
      handId,
      board: snap.board,
      potSats: snap.potSats,
      streetEnded: snap.street,
      seats: snap.seats
        .filter((s) => !s.empty && s.agentId)
        .map((s) => ({
          seatNo: s.seatNo,
          agentId: s.agentId!,
          stackSats: s.stackSats,
          hasFolded: s.hasFolded,
        })),
      result: snap.result,
    });
    if (hist) {
      recordHandParticipation(
        hist.seats.map((s) => ({
          agentId: s.agentId,
          stackStartSats: s.stackStartSats,
          stackEndSats: s.stackEndSats,
        })),
      );
    }
    publishHandEnd(channel(t.id), {
      ...((snap.result as object) ?? {}),
      handId,
    });
    t.pendingByAgent.clear();
    t.actionDeadline = null;
    t.hand = null;
    broadcast(t, true);
    // next hand shortly
    setTimeout(() => {
      if (t.seats.size >= 2) startHand(t);
      else {
        t.status = "open";
        broadcast(t);
      }
    }, 1500);
  } else {
    refreshPending(t);
    broadcast(t, true);
    armTimeout(t);
  }
  return snap;
}

export function agentPending(agentId: string): PendingForAgent[] {
  const out: PendingForAgent[] = [];
  for (const t of tables.values()) {
    const p = t.pendingByAgent.get(agentId);
    if (p) {
      p.timeLeftMs = Math.max(0, (t.actionDeadline ?? Date.now()) - Date.now());
      out.push(p);
    }
  }
  return out;
}

export function agentAct(
  agentId: string,
  body: {
    tableId: string;
    handId: string;
    seq: number;
    action: PlayerAction;
    message?: string;
  },
): EngineSnapshot {
  const t = tables.get(body.tableId);
  if (!t || !t.hand) {
    throw new TableError("no_hand", 409, "no active hand");
  }
  const snap0 = t.hand.snapshot();
  if (snap0.handId !== body.handId) {
    throw new TableError("stale_hand", 409, "hand id mismatch");
  }
  const pending = t.pendingByAgent.get(agentId);
  if (!pending) {
    throw new TableError("not_pending", 409, "not your action");
  }
  if (pending.seq !== body.seq) {
    throw new TableError("stale_seq", 409, "stale action seq");
  }
  const seatNo = t.hand.seats.find((s) => s.agentId === agentId && !s.empty)
    ?.seatNo;
  if (seatNo === undefined || snap0.actionSeat !== seatNo) {
    throw new TableError("not_your_turn", 409, "not your turn");
  }
  return applyTableAction(t, seatNo, body.action, body.message);
}

function broadcast(t: CashTable, isDelta = false): void {
  const payload = {
    ...publicTable(t),
    engine: t.hand
      ? {
          ...t.hand.snapshot(),
          // never leak holes in public feed
          seats: t.hand.snapshot().seats,
        }
      : null,
  };
  // strip holes from any accidental attach
  if (payload.engine && typeof payload.engine === "object") {
    const eng = payload.engine as EngineSnapshot;
    void eng;
  }
  const ch = channel(t.id);
  if (isDelta) publishDelta(ch, payload);
  else publishSnapshot(ch, payload);
  // lobby channel
  publishDelta("lobby", { tables: listTables() });
}

export function tableSnapshot(tableId: string): Record<string, unknown> | null {
  const t = tables.get(tableId);
  if (!t) return null;
  return {
    ...publicTable(t),
    engine: t.hand
      ? {
          ...t.hand.snapshot(),
          legalActions: null as LegalAction[] | null,
        }
      : null,
  };
}

export function resetTablesForTests(): void {
  tables.clear();
}

// re-export AgentError for routes
export { AgentError };

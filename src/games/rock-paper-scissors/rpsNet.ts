/**
 * Live RPS matchmaking + match state over Yjs / y-webrtc.
 * Room is shared by all paid RPS players on the floor.
 */

import type { LiveMatch, LobbyPlayer, RpsChoice, Seat } from "./logic";
import {
  advanceAfterReveal,
  applyPick,
  emptyMatch,
} from "./logic";

const ROOM = "coinup-rps-live-v1";

export type RpsNetHandle = {
  playerId: string;
  destroy: () => void;
  setPick: (choice: RpsChoice) => void;
  /** Practice mode — no network */
  isPractice: boolean;
};

export type RpsNetView = {
  status:
    | "connecting"
    | "queued"
    | "matched"
    | "finished"
    | "error"
    | "practice";
  message: string;
  match: LiveMatch | null;
  queueSize: number;
};

type Callbacks = {
  onView: (v: RpsNetView) => void;
  onWin: (potSats: number, match: LiveMatch) => void;
};

export async function joinRpsLive(opts: {
  playerId: string;
  name: string;
  sessionId: string;
  entrySats: number;
  practice?: boolean;
  callbacks: Callbacks;
}): Promise<RpsNetHandle> {
  if (opts.practice) {
    return joinPractice(opts);
  }

  const Y = await import("yjs");
  const { WebrtcProvider } = await import("y-webrtc");

  const doc = new Y.Doc();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let provider: any = null;
  let destroyed = false;
  let winClaimed = false;
  let myMatchId: string | null = null;

  const yLobby = doc.getMap<LobbyPlayer>("lobby");
  const yMatches = doc.getMap<LiveMatch>("matches");

  const seat: Seat = {
    id: opts.playerId,
    name: opts.name,
    sessionId: opts.sessionId,
    joinedAt: Date.now(),
  };

  const emit = () => {
    if (destroyed) return;
    const lobby = [...yLobby.values()];
    const waiting = lobby.filter((p) => !p.matchId);
    const me = yLobby.get(opts.playerId);
    const matchId = me?.matchId ?? myMatchId;
    const match = matchId ? yMatches.get(matchId) ?? null : null;

    if (match?.winnerId === opts.playerId && match.phase === "finished" && !winClaimed) {
      winClaimed = true;
      opts.callbacks.onWin(match.potSats, match);
    }

    if (match) {
      opts.callbacks.onView({
        status: match.phase === "finished" ? "finished" : "matched",
        message:
          match.phase === "finished"
            ? match.winnerId === opts.playerId
              ? "YOU WIN THE POT"
              : "YOU LOSE — BETTER LUCK"
            : match.phase === "reveal"
              ? "ROUND RESULT"
              : `ROUND ${match.round} · LOCK IN`,
        match,
        queueSize: waiting.length,
      });
      return;
    }

    opts.callbacks.onView({
      status: "queued",
      message: "WAITING FOR OPPONENT TO INSERT COIN…",
      match: null,
      queueSize: Math.max(1, waiting.length),
    });
  };

  const tryPair = () => {
    if (destroyed) return;
    const waiting = [...yLobby.values()]
      .filter((p) => !p.matchId)
      .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));

    if (waiting.length < 2) return;

    // Deterministic host = earliest joiner (then id)
    const host = waiting[0];
    if (host.id !== opts.playerId) return;

    const a = waiting[0];
    const b = waiting[1];
    const matchId = `rps_${a.id.slice(-6)}_${b.id.slice(-6)}_${Date.now().toString(36)}`;
    const match = emptyMatch(
      matchId,
      {
        id: a.id,
        name: a.name,
        sessionId: a.sessionId,
        joinedAt: a.joinedAt,
      },
      {
        id: b.id,
        name: b.name,
        sessionId: b.sessionId,
        joinedAt: b.joinedAt,
      },
      opts.entrySats,
    );

    doc.transact(() => {
      yMatches.set(matchId, match);
      const a2 = { ...a, matchId };
      const b2 = { ...b, matchId };
      yLobby.set(a.id, a2);
      yLobby.set(b.id, b2);
    });
    myMatchId = matchId;
  };

  const maybeAdvance = (match: LiveMatch) => {
    if (match.phase !== "reveal" || match.winnerId) return;
    // Both clients schedule advance; first write wins via identical state
    window.setTimeout(() => {
      if (destroyed) return;
      const current = yMatches.get(match.id);
      if (!current || current.phase !== "reveal") return;
      const next = advanceAfterReveal(current);
      yMatches.set(match.id, next);
    }, 1800);
  };

  try {
    provider = new WebrtcProvider(ROOM, doc);

    yLobby.set(opts.playerId, {
      id: opts.playerId,
      name: opts.name,
      sessionId: opts.sessionId,
      joinedAt: seat.joinedAt,
      matchId: null,
    });

    yLobby.observe(emit);
    yMatches.observe(() => {
      emit();
      const me = yLobby.get(opts.playerId);
      const m = me?.matchId ? yMatches.get(me.matchId) : null;
      if (m) maybeAdvance(m);
    });

    opts.callbacks.onView({
      status: "connecting",
      message: "LINKING TO LIVE ROOM…",
      match: null,
      queueSize: 0,
    });

    // Pairing loop
    const pairTimer = window.setInterval(() => {
      tryPair();
      emit();
    }, 800);

    // initial pair attempt
    window.setTimeout(() => {
      tryPair();
      emit();
    }, 400);

    const destroy = () => {
      destroyed = true;
      window.clearInterval(pairTimer);
      try {
        const me = yLobby.get(opts.playerId);
        if (me && !me.matchId) yLobby.delete(opts.playerId);
        provider?.destroy?.();
        doc.destroy();
      } catch {
        /* ignore */
      }
    };

    // store pairTimer cleanup on handle via closure
    return {
      playerId: opts.playerId,
      isPractice: false,
      destroy,
      setPick: (choice: RpsChoice) => {
        const me = yLobby.get(opts.playerId);
        const matchId = me?.matchId;
        if (!matchId) return;
        const match = yMatches.get(matchId);
        if (!match) return;
        const next = applyPick(match, opts.playerId, choice);
        yMatches.set(matchId, next);
        maybeAdvance(next);
      },
    };
  } catch {
    opts.callbacks.onView({
      status: "error",
      message: "COULD NOT OPEN LIVE ROOM — CHECK NETWORK / WEBRTC",
      match: null,
      queueSize: 0,
    });
    return {
      playerId: opts.playerId,
      isPractice: false,
      destroy: () => undefined,
      setPick: () => undefined,
    };
  }
}

function joinPractice(opts: {
  playerId: string;
  name: string;
  sessionId: string;
  entrySats: number;
  callbacks: Callbacks;
}): RpsNetHandle {
  let match = emptyMatch(
    `practice_${Date.now().toString(36)}`,
    {
      id: opts.playerId,
      name: opts.name,
      sessionId: opts.sessionId,
      joinedAt: Date.now(),
    },
    {
      id: "cpu",
      name: "CHIP-CPU",
      sessionId: "cpu",
      joinedAt: Date.now(),
    },
    opts.entrySats,
  );
  // practice pot is entry only (no second human)
  match.potSats = opts.entrySats;
  let destroyed = false;
  let winClaimed = false;

  const push = () => {
    if (destroyed) return;
    if (match.winnerId === opts.playerId && !winClaimed) {
      winClaimed = true;
      opts.callbacks.onWin(match.potSats, match);
    }
    opts.callbacks.onView({
      status: match.phase === "finished" ? "finished" : "practice",
      message:
        match.phase === "finished"
          ? match.winnerId === opts.playerId
            ? "YOU BEAT CHIP-CPU"
            : "CHIP-CPU WINS"
          : "PRACTICE · BEST OF 3",
      match,
      queueSize: 0,
    });
  };

  push();

  return {
    playerId: opts.playerId,
    isPractice: true,
    destroy: () => {
      destroyed = true;
    },
    setPick: (choice) => {
      if (match.phase !== "waiting_picks") return;
      const cpuChoices: RpsChoice[] = ["rock", "paper", "scissors"];
      const cpu = cpuChoices[Math.floor(Math.random() * 3)]!;
      match = applyPick(match, opts.playerId, choice);
      match = applyPick(match, "cpu", cpu);
      push();
      if (match.phase === "reveal") {
        window.setTimeout(() => {
          match = advanceAfterReveal(match);
          push();
        }, 1600);
      }
    },
  };
}

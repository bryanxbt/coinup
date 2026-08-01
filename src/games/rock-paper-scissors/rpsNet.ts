/**
 * Live RPS matchmaking via PeerJS (free cloud broker).
 *
 * y-webrtc was too flaky across browsers (both players stuck in queue).
 * PeerJS: first player claims a seat host ID; second connects as guest.
 * Host owns match state and broadcasts updates.
 */

import type { LiveMatch, RpsChoice, Seat } from "./logic";
import {
  advanceAfterReveal,
  applyPick,
  emptyMatch,
} from "./logic";

const SEAT_PREFIX = "coinup-rps-seat-v3-";
const SEAT_COUNT = 8;
/** Also mirror matchmaking on BroadcastChannel (same browser, two tabs). */
const BC_NAME = "coinup-rps-bc-v3";

export type RpsNetHandle = {
  playerId: string;
  destroy: () => void;
  setPick: (choice: RpsChoice) => void;
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

type WireMsg =
  | { type: "hello"; seat: Seat; entrySats: number }
  | { type: "match"; match: LiveMatch }
  | { type: "pick"; playerId: string; choice: RpsChoice }
  | { type: "state"; match: LiveMatch }
  | { type: "ping" };

export async function joinRpsLive(opts: {
  playerId: string;
  name: string;
  sessionId: string;
  entrySats: number;
  practice?: boolean;
  callbacks: Callbacks;
}): Promise<RpsNetHandle> {
  if (opts.practice) return joinPractice(opts);

  const mySeat: Seat = {
    id: opts.playerId,
    name: opts.name,
    sessionId: opts.sessionId,
    joinedAt: Date.now(),
  };

  let destroyed = false;
  let winClaimed = false;
  let match: LiveMatch | null = null;
  let role: "host" | "guest" | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let peer: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let conn: any = null;
  let bc: BroadcastChannel | null = null;

  const emit = (status: RpsNetView["status"], message: string, queueSize = 1) => {
    if (destroyed) return;
    if (match?.winnerId === opts.playerId && match.phase === "finished" && !winClaimed) {
      winClaimed = true;
      opts.callbacks.onWin(match.potSats, match);
    }
    opts.callbacks.onView({
      status,
      message,
      match,
      queueSize,
    });
  };

  const broadcastState = () => {
    if (!match) return;
    const msg: WireMsg = { type: "state", match };
    try {
      conn?.send(msg);
    } catch {
      /* ignore */
    }
    try {
      bc?.postMessage({ ...msg, channel: "state" });
    } catch {
      /* ignore */
    }
  };

  const setMatch = (m: LiveMatch, status?: RpsNetView["status"]) => {
    match = m;
    const st =
      status ??
      (m.phase === "finished"
        ? "finished"
        : ("matched" as const));
    const message =
      m.phase === "finished"
        ? m.winnerId === opts.playerId
          ? "YOU WIN THE POT"
          : "YOU LOSE — BETTER LUCK"
        : m.phase === "reveal"
          ? "ROUND RESULT"
          : `ROUND ${m.round} · LOCK IN`;
    emit(st, message, 2);
    if (role === "host") broadcastState();
    if (m.phase === "reveal" && !m.winnerId) {
      window.setTimeout(() => {
        if (destroyed || !match || match.phase !== "reveal") return;
        if (role === "host") {
          match = advanceAfterReveal(match);
          setMatch(match);
        }
      }, 1800);
    }
  };

  const onRemotePick = (playerId: string, choice: RpsChoice) => {
    if (!match || role !== "host") return;
    match = applyPick(match, playerId, choice);
    setMatch(match);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wireConn = (c: any, asHost: boolean) => {
    conn = c;
    c.on("data", (raw: unknown) => {
      const msg = raw as WireMsg;
      if (!msg || typeof msg !== "object") return;

      if (msg.type === "hello" && asHost && !match) {
        const m = emptyMatch(
          `rps_${mySeat.id.slice(-4)}_${msg.seat.id.slice(-4)}_${Date.now().toString(36)}`,
          mySeat,
          msg.seat,
          Math.max(opts.entrySats, msg.entrySats),
        );
        setMatch(m);
        try {
          c.send({ type: "match", match: m } satisfies WireMsg);
        } catch {
          /* ignore */
        }
        return;
      }

      if (msg.type === "match" && !asHost) {
        setMatch(msg.match);
        return;
      }

      if (msg.type === "state") {
        match = msg.match;
        setMatch(msg.match);
        return;
      }

      if (msg.type === "pick" && asHost) {
        onRemotePick(msg.playerId, msg.choice);
      }
    });

    c.on("close", () => {
      if (destroyed) return;
      if (match?.phase !== "finished") {
        emit("error", "OPPONENT DISCONNECTED", 1);
      }
    });

    c.on("open", () => {
      if (!asHost) {
        try {
          c.send({
            type: "hello",
            seat: mySeat,
            entrySats: opts.entrySats,
          } satisfies WireMsg);
        } catch {
          /* ignore */
        }
      } else {
        emit("queued", "OPPONENT LINKING…", 2);
      }
    });
  };

  const destroy = () => {
    destroyed = true;
    try {
      conn?.close();
    } catch {
      /* ignore */
    }
    try {
      peer?.destroy();
    } catch {
      /* ignore */
    }
    try {
      bc?.close();
    } catch {
      /* ignore */
    }
  };

  emit("connecting", "OPENING LIVE LINK…", 0);

  // --- BroadcastChannel path (two tabs, same browser) ---
  try {
    bc = new BroadcastChannel(BC_NAME);
    bc.onmessage = (ev) => {
      const data = ev.data as WireMsg & { fromId?: string; wantMatch?: boolean };
      if (!data || data.fromId === opts.playerId) return;

      if (data.type === "hello" && role === "host" && !match && data.wantMatch) {
        // Guest announced via BC — host creates match and posts it
        const guestSeat = (data as unknown as { seat: Seat }).seat;
        if (!guestSeat) return;
        const m = emptyMatch(
          `rps_bc_${Date.now().toString(36)}`,
          mySeat,
          guestSeat,
          opts.entrySats,
        );
        setMatch(m);
        bc?.postMessage({ type: "match", match: m, fromId: opts.playerId });
        return;
      }

      if (data.type === "match" && !match) {
        role = role ?? "guest";
        setMatch(data.match);
        return;
      }

      if (data.type === "state" && match) {
        setMatch(data.match);
        return;
      }

      if (data.type === "pick" && role === "host") {
        onRemotePick(data.playerId, data.choice);
      }
    };
  } catch {
    bc = null;
  }

  // --- PeerJS path (cross-browser) ---
  try {
    const PeerCtor = (await import("peerjs")).default;

    const tryHostSeat = (seatIndex: number): Promise<"host" | "taken"> =>
      new Promise((resolve) => {
        const id = `${SEAT_PREFIX}${seatIndex}`;
        const p = new PeerCtor(id, { debug: 0 });
        let settled = false;
        const done = (r: "host" | "taken") => {
          if (settled) return;
          settled = true;
          resolve(r);
        };
        p.on("open", () => {
          peer = p;
          role = "host";
          done("host");
        });
        p.on("error", (err) => {
          const t = (err as { type?: string }).type;
          if (t === "unavailable-id") {
            try {
              p.destroy();
            } catch {
              /* ignore */
            }
            done("taken");
          }
        });
        window.setTimeout(() => {
          if (!settled) {
            try {
              p.destroy();
            } catch {
              /* ignore */
            }
            done("taken");
          }
        }, 4000);
      });

    const connectAsGuest = (seatIndex: number): Promise<boolean> =>
      new Promise((resolve) => {
        const hostId = `${SEAT_PREFIX}${seatIndex}`;
        const p = new PeerCtor({ debug: 0 });
        peer = p;
        p.on("open", () => {
          const c = p.connect(hostId, { reliable: true });
          let ok = false;
          c.on("open", () => {
            ok = true;
            role = "guest";
            wireConn(c, false);
            resolve(true);
          });
          c.on("error", () => resolve(false));
          window.setTimeout(() => {
            if (!ok) resolve(false);
          }, 5000);
        });
        p.on("error", () => resolve(false));
      });

    let linked = false;

    // 1) Prefer joining an existing host (avoids two lonely hosts)
    for (let i = 0; i < SEAT_COUNT && !linked && !destroyed; i++) {
      emit("connecting", `LOOKING FOR HOST ${i + 1}/${SEAT_COUNT}…`, 0);
      const joined = await connectAsGuest(i);
      if (joined) {
        linked = true;
        emit("queued", "LINKED · STARTING MATCH…", 2);
        break;
      }
      try {
        peer?.destroy();
      } catch {
        /* ignore */
      }
      peer = null;
    }

    // 2) No host found — claim a seat and wait
    for (let i = 0; i < SEAT_COUNT && !linked && !destroyed; i++) {
      emit("connecting", `CLAIMING SEAT ${i + 1}/${SEAT_COUNT}…`, 0);
      const result = await tryHostSeat(i);
      if (destroyed) break;

      if (result === "host" && peer) {
        role = "host";
        emit("queued", "WAITING FOR OPPONENT…", 1);
        bc?.postMessage({
          type: "hello",
          fromId: opts.playerId,
          seat: mySeat,
          entrySats: opts.entrySats,
          hostWaiting: true,
        });

        peer.on("connection", (c: unknown) => {
          if (match) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (c as any).close();
            return;
          }
          wireConn(c, true);
        });
        linked = true;
        break;
      }
    }

    // BroadcastChannel guest: if someone is host in another tab
    if (!linked && bc) {
      role = "guest";
      emit("queued", "WAITING FOR OPPONENT… (LOCAL BUS)", 1);
      bc.postMessage({
        type: "hello",
        fromId: opts.playerId,
        seat: mySeat,
        entrySats: opts.entrySats,
        wantMatch: true,
      });
      // Host BC handler will post match
      linked = true;
    }

    if (!linked) {
      emit(
        "error",
        "COULD NOT OPEN LIVE LINK — TRY PRACTICE OR SAME WIFI",
        0,
      );
    } else if (role === "host") {
      emit("queued", "WAITING FOR OPPONENT TO INSERT COIN…", 1);
    }
  } catch {
    emit("error", "LIVE LINK FAILED — USE PRACTICE VS CHIP-CPU", 0);
  }

  return {
    playerId: opts.playerId,
    isPractice: false,
    destroy,
    setPick: (choice: RpsChoice) => {
      if (!match) return;
      if (role === "host") {
        match = applyPick(match, opts.playerId, choice);
        setMatch(match);
      } else {
        // optimistic local apply when state echoes; still send pick
        const msg: WireMsg = {
          type: "pick",
          playerId: opts.playerId,
          choice,
        };
        try {
          conn?.send(msg);
        } catch {
          /* ignore */
        }
        try {
          bc?.postMessage({ ...msg, fromId: opts.playerId });
        } catch {
          /* ignore */
        }
        // apply locally so UI locks pick immediately
        match = applyPick(match, opts.playerId, choice);
        emit(
          match.phase === "finished" ? "finished" : "matched",
          match.phase === "reveal" ? "ROUND RESULT" : `ROUND ${match.round} · LOCKED`,
          2,
        );
      }
    },
  };
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

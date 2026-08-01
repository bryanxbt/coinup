/**
 * Live RPS matchmaking via PeerJS (free cloud broker).
 *
 * Host claims a seat ID; guest connects. Host owns match state.
 * Critical: PeerJS connections may already be "open" when we wire handlers —
 * always flush hello/match on open state, don't only listen for the event.
 */

import type { LiveMatch, RpsChoice, Seat } from "./logic";
import {
  advanceAfterReveal,
  applyPick,
  emptyMatch,
} from "./logic";

const SEAT_PREFIX = "coinup-rps-seat-v4-";
const SEAT_COUNT = 8;
const BC_NAME = "coinup-rps-bc-v4";

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
  let revealTimer: number | null = null;

  const emit = (
    status: RpsNetView["status"],
    message: string,
    queueSize = 1,
  ) => {
    if (destroyed) return;
    if (
      match?.winnerId === opts.playerId &&
      match.phase === "finished" &&
      !winClaimed
    ) {
      winClaimed = true;
      opts.callbacks.onWin(match.potSats, match);
    }
    opts.callbacks.onView({ status, message, match, queueSize });
  };

  const send = (msg: WireMsg) => {
    try {
      if (conn?.open) conn.send(msg);
    } catch {
      /* ignore */
    }
    try {
      bc?.postMessage({ ...msg, fromId: opts.playerId });
    } catch {
      /* ignore */
    }
  };

  const setMatch = (m: LiveMatch) => {
    match = m;
    const status: RpsNetView["status"] =
      m.phase === "finished" ? "finished" : "matched";
    const message =
      m.phase === "finished"
        ? m.winnerId === opts.playerId
          ? "YOU WIN THE POT"
          : "YOU LOSE — BETTER LUCK"
        : m.phase === "reveal"
          ? "ROUND RESULT"
          : `ROUND ${m.round} · LOCK IN`;
    emit(status, message, 2);

    if (role === "host") {
      send({ type: "state", match: m });
    }

    if (m.phase === "reveal" && !m.winnerId && role === "host") {
      if (revealTimer) window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => {
        if (destroyed || !match || match.phase !== "reveal") return;
        match = advanceAfterReveal(match);
        setMatch(match);
      }, 1800);
    }
  };

  const hostCreateMatch = (guest: Seat, guestEntry: number) => {
    if (match) return;
    const m = emptyMatch(
      `rps_${mySeat.id.slice(-4)}_${guest.id.slice(-4)}_${Date.now().toString(36)}`,
      mySeat,
      guest,
      Math.max(opts.entrySats, guestEntry),
    );
    setMatch(m);
    send({ type: "match", match: m });
  };

  const onRemotePick = (playerId: string, choice: RpsChoice) => {
    if (!match || role !== "host") return;
    match = applyPick(match, playerId, choice);
    setMatch(match);
  };

  const handleMsg = (raw: unknown, asHost: boolean) => {
    const msg = raw as WireMsg;
    if (!msg || typeof msg !== "object" || !("type" in msg)) return;

    if (msg.type === "hello" && asHost) {
      hostCreateMatch(msg.seat, msg.entrySats);
      return;
    }
    if (msg.type === "match" && !asHost) {
      role = "guest";
      setMatch(msg.match);
      return;
    }
    if (msg.type === "state") {
      // Guest applies host state; host ignores echo
      if (role !== "host") {
        setMatch(msg.match);
      }
      return;
    }
    if (msg.type === "pick" && asHost) {
      onRemotePick(msg.playerId, msg.choice);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wireConn = (c: any, asHost: boolean) => {
    conn = c;

    c.on("data", (raw: unknown) => handleMsg(raw, asHost));

    c.on("close", () => {
      if (destroyed) return;
      if (match?.phase !== "finished") {
        emit("error", "OPPONENT DISCONNECTED", 1);
      }
    });

    const onOpen = () => {
      if (asHost) {
        emit("queued", "OPPONENT LINKED · STARTING…", 2);
        // Ask guest to hello again in case we missed first packet
        send({ type: "ping" });
      } else {
        // Guest: always send hello when channel is ready
        send({
          type: "hello",
          seat: mySeat,
          entrySats: opts.entrySats,
        });
        emit("queued", "SENT HELLO · WAITING FOR MATCH…", 2);
      }
    };

    // CRITICAL: connection may already be open — event won't re-fire
    if (c.open) {
      onOpen();
    } else {
      c.on("open", onOpen);
    }
  };

  const destroy = () => {
    destroyed = true;
    if (revealTimer) window.clearTimeout(revealTimer);
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

  // BroadcastChannel (same browser, normal + sometimes works with care)
  try {
    bc = new BroadcastChannel(BC_NAME);
    bc.onmessage = (ev) => {
      const data = ev.data as WireMsg & {
        fromId?: string;
        wantMatch?: boolean;
        hostWaiting?: boolean;
        seat?: Seat;
        entrySats?: number;
      };
      if (!data || data.fromId === opts.playerId) return;

      // Guest sees host waiting — introduce ourselves
      if (
        data.hostWaiting &&
        role !== "host" &&
        !match &&
        data.type === "hello"
      ) {
        bc?.postMessage({
          type: "hello",
          fromId: opts.playerId,
          seat: mySeat,
          entrySats: opts.entrySats,
          wantMatch: true,
        });
        return;
      }

      if (
        data.type === "hello" &&
        role === "host" &&
        !match &&
        (data.wantMatch || data.seat)
      ) {
        const guestSeat = data.seat;
        if (!guestSeat) return;
        hostCreateMatch(guestSeat, data.entrySats ?? opts.entrySats);
        return;
      }

      if (data.type === "match" && !match) {
        role = "guest";
        setMatch(data.match);
        return;
      }

      if (data.type === "state" && data.match && role !== "host") {
        setMatch(data.match);
        return;
      }

      if (data.type === "pick" && role === "host") {
        onRemotePick(data.playerId, data.choice);
      }

      if (data.type === "ping" && role !== "host" && !match) {
        bc?.postMessage({
          type: "hello",
          fromId: opts.playerId,
          seat: mySeat,
          entrySats: opts.entrySats,
          wantMatch: true,
        });
      }
    };
  } catch {
    bc = null;
  }

  // PeerJS
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
        p.on("error", (err: { type?: string }) => {
          if (err.type === "unavailable-id") {
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
        }, 5000);
      });

    const connectAsGuest = (seatIndex: number): Promise<boolean> =>
      new Promise((resolve) => {
        const hostId = `${SEAT_PREFIX}${seatIndex}`;
        const p = new PeerCtor({ debug: 0 });
        let settled = false;
        const finish = (ok: boolean) => {
          if (settled) return;
          settled = true;
          if (!ok) {
            try {
              p.destroy();
            } catch {
              /* ignore */
            }
            if (peer === p) peer = null;
          }
          resolve(ok);
        };

        p.on("open", () => {
          peer = p;
          const c = p.connect(hostId, { reliable: true });
          c.on("open", () => {
            role = "guest";
            wireConn(c, false);
            finish(true);
          });
          c.on("error", () => finish(false));
          window.setTimeout(() => finish(false), 6000);
        });
        p.on("error", () => finish(false));
        window.setTimeout(() => finish(false), 8000);
      });

    let linked = false;

    // Join existing host first
    for (let i = 0; i < SEAT_COUNT && !linked && !destroyed; i++) {
      emit("connecting", `LOOKING FOR HOST ${i + 1}/${SEAT_COUNT}…`, 0);
      const joined = await connectAsGuest(i);
      if (joined) {
        linked = true;
        // hello already sent in wireConn when open
        break;
      }
    }

    // Claim host seat
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
            try {
              (c as { close: () => void }).close();
            } catch {
              /* ignore */
            }
            return;
          }
          wireConn(c, true);
        });
        linked = true;
        break;
      }
    }

    if (!linked && bc) {
      role = "guest";
      emit("queued", "WAITING ON LOCAL BUS…", 1);
      bc.postMessage({
        type: "hello",
        fromId: opts.playerId,
        seat: mySeat,
        entrySats: opts.entrySats,
        wantMatch: true,
      });
      linked = true;
    }

    if (!linked) {
      emit("error", "COULD NOT OPEN LIVE LINK — TRY PRACTICE", 0);
    } else if (role === "host" && !match) {
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
        send({ type: "pick", playerId: opts.playerId, choice });
        // Optimistic lock UI — host will echo full state
        match = applyPick(match, opts.playerId, choice);
        emit(
          match.phase === "finished" ? "finished" : "matched",
          match.phase === "reveal"
            ? "ROUND RESULT"
            : `ROUND ${match.round} · LOCKED`,
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

/**
 * Arcade floor presence — who is on the floor right now.
 *
 * Uses Yjs + y-webrtc (public signaling) so static GitHub Pages can still
 * see concurrent visitors without our own backend. Best-effort: corporate
 * firewalls / strict browsers may block WebRTC peers.
 */

export type FloorPeer = {
  id: number;
  name: string;
  joinedAt: number;
};

export type PresenceSnapshot = {
  /** Total people on the floor including you */
  count: number;
  /** True after the local client has joined the room */
  connected: boolean;
  /** Peers currently advertised (includes self when ready) */
  peers: FloorPeer[];
  /** Human status for HUD */
  status: "connecting" | "online" | "solo" | "blocked";
};

const ROOM = "coinup-arcade-floor-v1";

function guestName(): string {
  if (typeof window === "undefined") return "GUEST";
  const key = "coinup.guestName.v1";
  let name = window.localStorage.getItem(key);
  if (!name) {
    const n = Math.floor(1000 + Math.random() * 9000);
    name = `PLAYER-${n}`;
    window.localStorage.setItem(key, name);
  }
  return name;
}

export type PresenceHandle = {
  destroy: () => void;
};

/**
 * Join the shared arcade room. Calls `onChange` whenever peer set updates.
 * Must only run in the browser.
 */
export async function joinArcadePresence(
  onChange: (snap: PresenceSnapshot) => void,
): Promise<PresenceHandle> {
  const Y = await import("yjs");
  const { WebrtcProvider } = await import("y-webrtc");

  const doc = new Y.Doc();
  const name = guestName();
  const joinedAt = Date.now();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let provider: any = null;
  let destroyed = false;

  const emit = () => {
    if (destroyed || !provider) return;
    const states = provider.awareness.getStates() as Map<
      number,
      { user?: { name?: string; joinedAt?: number } }
    >;
    const peers: FloorPeer[] = [];
    states.forEach((state, clientId) => {
      if (state?.user?.name) {
        peers.push({
          id: clientId,
          name: state.user.name,
          joinedAt: state.user.joinedAt ?? 0,
        });
      }
    });
    peers.sort((a, b) => a.joinedAt - b.joinedAt);
    const count = Math.max(1, peers.length);
    const connected = peers.length > 0;
    let status: PresenceSnapshot["status"] = "connecting";
    if (connected && count === 1) status = "solo";
    else if (connected && count > 1) status = "online";
    onChange({ count, connected, peers, status });
  };

  try {
    // Public signaling by default — room name scopes CoinUp visitors
    provider = new WebrtcProvider(ROOM, doc);

    provider.awareness.setLocalStateField("user", {
      name,
      joinedAt,
      room: "cabinet-hall",
    });

    provider.awareness.on("change", emit);
    provider.on?.("status", emit);
    emit();
    window.setTimeout(emit, 2500);
  } catch {
    onChange({
      count: 1,
      connected: false,
      peers: [{ id: 0, name, joinedAt }],
      status: "blocked",
    });
  }

  return {
    destroy: () => {
      destroyed = true;
      try {
        provider?.awareness?.setLocalState(null);
        provider?.destroy?.();
        doc.destroy();
      } catch {
        /* ignore */
      }
    },
  };
}

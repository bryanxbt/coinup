"use client";

import { useEffect, useState } from "react";
import {
  joinArcadePresence,
  type PresenceSnapshot,
} from "@/lib/presence";

const INITIAL: PresenceSnapshot = {
  count: 1,
  connected: false,
  peers: [],
  status: "connecting",
};

/** Live count of people currently on the CoinUp arcade floor. */
export function useArcadePresence(): PresenceSnapshot {
  const [snap, setSnap] = useState<PresenceSnapshot>(INITIAL);

  useEffect(() => {
    let handle: { destroy: () => void } | null = null;
    let cancelled = false;

    void (async () => {
      try {
        handle = await joinArcadePresence((next) => {
          if (!cancelled) setSnap(next);
        });
      } catch {
        if (!cancelled) {
          setSnap({
            count: 1,
            connected: false,
            peers: [],
            status: "blocked",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      handle?.destroy();
    };
  }, []);

  return snap;
}

export function presenceLabel(snap: PresenceSnapshot): string {
  if (snap.status === "connecting") return "SCANNING FLOOR…";
  if (snap.status === "blocked") return "1 ON FLOOR (LINK LOCAL)";
  if (snap.count <= 1) return "1 ON THE FLOOR · JUST YOU";
  return `${snap.count} ON THE FLOOR`;
}

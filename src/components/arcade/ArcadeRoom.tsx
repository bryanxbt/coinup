"use client";

/**
 * Phaser host for the immersive Cabinet Hall (ADR-002).
 * Dynamic import keeps Phaser off the server / static export path.
 */

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFloorCabinets } from "@/lib/arcade-floor";

const ROOM_W = 18 * 32;
const ROOM_H = 12 * 32;

export function ArcadeRoom() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<{ destroy: (removeCanvas?: boolean) => void } | null>(
    null,
  );
  const router = useRouter();

  const onCabinetSelect = useCallback(
    (gameId: string, externalUrl?: string) => {
      if (externalUrl) {
        window.open(externalUrl, "_blank", "noreferrer");
        return;
      }
      // Next.js applies basePath to app routes — do not withBase here
      router.push(`/play/${gameId}`);
    },
    [router],
  );

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;

    let cancelled = false;

    void (async () => {
      const Phaser = (await import("phaser")).default;
      const { ArcadeScene } = await import(
        "@/components/arcade/room/ArcadeScene"
      );

      if (cancelled || !hostRef.current) return;

      const cabinets = getFloorCabinets();

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: hostRef.current,
        width: ROOM_W,
        height: ROOM_H,
        backgroundColor: "#000012",
        pixelArt: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        scene: [ArcadeScene],
      });

      game.scene.start("ArcadeScene", {
        cabinets,
        onCabinetSelect,
      });

      gameRef.current = game;
    })();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [onCabinetSelect]);

  return (
    <div className="arcade-room-shell">
      <div
        ref={hostRef}
        className="arcade-room-canvas"
        style={{
          width: "100%",
          maxWidth: ROOM_W,
          margin: "0 auto",
          aspectRatio: `${ROOM_W} / ${ROOM_H}`,
          border: "3px solid #2a2a33",
          boxShadow: "6px 6px 0 #000",
          imageRendering: "pixelated",
          background: "#000012",
        }}
      />
      <p className="mt-3 text-center font-pixel text-[8px] text-[#5c5c6b]">
        PIXEL ROOM v0 · PLACEHOLDER ART · ADR-002
      </p>
    </div>
  );
}

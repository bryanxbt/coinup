"use client";

/**
 * Phaser host — scrollable dual-aisle Cabinet Hall (ADR-002).
 */

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getFloorCabinets } from "@/lib/arcade-floor";
import { VIEW_W, VIEW_H } from "@/components/arcade/room/ArcadeScene";

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
        width: VIEW_W,
        height: VIEW_H,
        backgroundColor: "#000012",
        pixelArt: true,
        banner: false,
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
          maxWidth: VIEW_W,
          margin: "0 auto",
          aspectRatio: `${VIEW_W} / ${VIEW_H}`,
          border: "3px solid #2a2a33",
          boxShadow: "6px 6px 0 #000",
          imageRendering: "pixelated",
          background: "#000012",
          touchAction: "none",
        }}
      />
      <p className="mt-3 text-center font-pixel text-[8px] text-[#5c5c6b]">
        DRAG / ARROWS / WHEEL TO LOOK · CLICK CABINET TO PLAY
      </p>
    </div>
  );
}

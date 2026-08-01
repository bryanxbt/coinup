"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { TypeText } from "@/components/arcade/TypeText";
import { PixelCabinet } from "@/components/arcade/PixelCabinet";
import { FLOOR_META, getFloorCabinets } from "@/lib/arcade-floor";
import { withBase } from "@/lib/paths";

/**
 * Interactive Cabinet Hall — top-down / front-row arcade floor.
 * Click a live cabinet to play. Soon cabinets stay dark with WIP tape.
 */
export function ArcadeFloor() {
  const cabinets = useMemo(() => getFloorCabinets(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusLine, setStatusLine] = useState(
    "WALK THE FLOOR · CLICK A CABINET",
  );

  const rows = useMemo(() => {
    const map = new Map<number, typeof cabinets>();
    for (const c of cabinets) {
      const list = map.get(c.row) ?? [];
      list.push(c);
      map.set(c.row, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.col - b.col);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [cabinets]);

  const selected = cabinets.find((c) => c.gameId === selectedId)?.game;

  return (
    <section className="floor-wrap" aria-label="CoinUp Cabinet Hall">
      {/* Room chrome */}
      <div className="floor-hud">
        <div>
          <p className="floor-hud-zone">{FLOOR_META.zone}</p>
          <h2 className="floor-hud-title">{FLOOR_META.room}</h2>
        </div>
        <div className="floor-hud-chip">
          <Image
            src={withBase("/images/chip-arcade-manager-32.png")}
            alt=""
            width={28}
            height={28}
            unoptimized
            className="pixelated"
          />
          <span>{FLOOR_META.managerNote}</span>
        </div>
      </div>

      <p className="floor-tagline">
        <TypeText
          text={FLOOR_META.tagline}
          speed={18}
          className="font-pixel text-[8px] text-[var(--crt-green)] sm:text-[9px]"
          holdCursor
        />
      </p>

      {/* The floor itself */}
      <div className="floor-stage">
        {/* Back wall */}
        <div className="floor-wall" aria-hidden>
          <span className="floor-neon floor-neon--pink">HIGH SCORE</span>
          <span className="floor-neon floor-neon--gold">COINUP</span>
          <span className="floor-neon floor-neon--cyan">INSERT COIN</span>
        </div>

        {/* Carpet + cabinets */}
        <div className="floor-carpet">
          <div className="floor-carpet-grid" />
          <div className="floor-aisles">
            {rows.map(([row, slots]) => (
              <div key={row} className="floor-aisle" data-aisle={row + 1}>
                <span className="floor-aisle-label">AISLE {row + 1}</span>
                <div className="floor-row">
                  {slots.map((slot) => (
                    <PixelCabinet
                      key={slot.gameId}
                      game={slot.game}
                      selected={selectedId === slot.gameId}
                      onSelect={() => {
                        setSelectedId(slot.gameId);
                        if (slot.game.status === "playable") {
                          setStatusLine(
                            `▶ ${slot.game.title.toUpperCase()} · LIVE · INSERT SATS`,
                          );
                        } else {
                          setStatusLine(
                            `… ${slot.game.title.toUpperCase()} · CHIP IS STILL WIRING THIS ONE`,
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Manager desk / Chip on floor */}
          <div className="floor-desk">
            <Image
              src={withBase("/images/chip-arcade-manager-64.png")}
              alt="Chip the Arcade Manager"
              width={64}
              height={64}
              unoptimized
              className="pixelated floor-desk-chip"
            />
            <div className="floor-desk-sign">
              <p>MANAGER</p>
              <p className="text-[var(--crt-green)]">ALL ACCESS</p>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="floor-status" role="status">
          <span className="floor-status-dot" />
          <span className="floor-status-text">{statusLine}</span>
          {selected && selected.status === "playable" && (
            <span className="floor-status-hint">CLICK AGAIN / OPEN TO PLAY</span>
          )}
        </div>
      </div>

      <p className="floor-legend">
        <span className="floor-legend-live">■ LIVE</span>
        <span className="floor-legend-soon">■ COMING SOON</span>
        <span className="floor-legend-note">
          {cabinets.filter((c) => c.game.status === "playable").length} ONLINE ·{" "}
          {cabinets.filter((c) => c.game.status !== "playable").length} IN
          TRANSIT
        </span>
      </p>
    </section>
  );
}

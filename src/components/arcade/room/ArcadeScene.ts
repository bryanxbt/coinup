/**
 * CoinUp Arcade Room — Phaser 3 scene (ADR-002).
 * Placeholder graphics until pixel art drop-in.
 * Cabinets read from floor registry; click routes to GameModule play flow.
 */

import Phaser from "phaser";
import type { PlacedCabinet } from "@/lib/arcade-floor";

export type ArcadeSceneData = {
  cabinets: PlacedCabinet[];
  onCabinetSelect: (gameId: string, externalUrl?: string) => void;
};

const TILE = 32;
const ROOM_COLS = 18;
const ROOM_ROWS = 12;

type CabSprite = Phaser.GameObjects.Container & {
  gameId: string;
  externalUrl?: string;
  playable: boolean;
  baseY: number;
};

export class ArcadeScene extends Phaser.Scene {
  private cabinets: PlacedCabinet[] = [];
  private onCabinetSelect: ArcadeSceneData["onCabinetSelect"] = () => {};
  private cabSprites: CabSprite[] = [];
  private chip!: Phaser.GameObjects.Container;
  private walkers: Phaser.GameObjects.Container[] = [];
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super("ArcadeScene");
  }

  init(data: ArcadeSceneData) {
    this.cabinets = data.cabinets ?? [];
    this.onCabinetSelect = data.onCabinetSelect ?? (() => {});
  }

  create() {
    const w = ROOM_COLS * TILE;
    const h = ROOM_ROWS * TILE;

    // Room backdrop
    this.add.rectangle(w / 2, h / 2, w, h, 0x0a0610).setDepth(0);

    // Floor grid (pixel carpet feel)
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x12081a, 1);
    g.fillRect(0, TILE * 2, w, h - TILE * 2);
    g.lineStyle(1, 0x1a1028, 0.8);
    for (let x = 0; x <= ROOM_COLS; x++) {
      g.lineBetween(x * TILE, TILE * 2, x * TILE, h);
    }
    for (let y = 2; y <= ROOM_ROWS; y++) {
      g.lineBetween(0, y * TILE, w, y * TILE);
    }

    // Back wall
    g.fillStyle(0x0e0e1a, 1);
    g.fillRect(0, 0, w, TILE * 2);
    g.lineStyle(2, 0x2a2a33, 1);
    g.strokeRect(0, 0, w, TILE * 2);

    // Neon wall signs
    this.add
      .text(TILE * 2, TILE * 0.6, "HIGH SCORE", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ff4ec7",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(w / 2, TILE * 0.6, "COINUP", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#fcc76e",
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.add
      .text(w - TILE * 2, TILE * 0.6, "INSERT COIN", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#00d0ff",
      })
      .setOrigin(0.5)
      .setDepth(5);

    // Cabinets from registry
    this.layoutCabinets();

    // Chip at desk (right side)
    this.chip = this.makeCharacter(w - TILE * 2.5, h - TILE * 2.2, 0x2962ff, "C");
    this.chip.setDepth(20);
    this.tweens.add({
      targets: this.chip,
      x: w - TILE * 4,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Ambient walkers
    for (let i = 0; i < 2; i++) {
      const wx = TILE * (3 + i * 5);
      const wy = TILE * (5 + (i % 2));
      const walker = this.makeCharacter(wx, wy, 0x5c5c6b, "·");
      walker.setDepth(15);
      this.walkers.push(walker);
      this.tweens.add({
        targets: walker,
        x: wx + TILE * 4,
        duration: 5000 + i * 800,
        yoyo: true,
        repeat: -1,
        ease: "Linear",
        delay: i * 600,
      });
    }

    // Status bar
    this.statusText = this.add
      .text(TILE * 0.5, h - 14, "WALK THE FLOOR · CLICK A CABINET", {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#00de76",
      })
      .setDepth(30);

    // Attract loop
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => this.pulseAttract(),
    });
  }

  private layoutCabinets() {
    // Map col/row → pixel positions in room
    const originX = TILE * 2.5;
    const originY = TILE * 3.5;
    const gapX = TILE * 3.2;
    const gapY = TILE * 3.8;

    for (const slot of this.cabinets) {
      const x = originX + slot.col * gapX;
      const y = originY + slot.row * gapY;
      const playable = slot.game.status === "playable";
      const color = playable
        ? Phaser.Display.Color.HexStringToColor(slot.game.accent || "#fcc76e")
            .color
        : 0x3a3a44;

      const body = this.add.rectangle(0, 8, 40, 48, color).setStrokeStyle(2, 0x000000);
      const screen = this.add
        .rectangle(0, -6, 28, 20, 0x000012)
        .setStrokeStyle(1, 0x14141a);
      const label = this.add
        .text(0, -6, playable ? slot.game.glyph : "…", {
          fontSize: "12px",
        })
        .setOrigin(0.5);
      const title = this.add
        .text(0, 36, slot.game.title.slice(0, 10).toUpperCase(), {
          fontFamily: "monospace",
          fontSize: "7px",
          color: playable ? "#ffffff" : "#5c5c6b",
        })
        .setOrigin(0.5);

      const container = this.add.container(x, y, [body, screen, label, title]) as CabSprite;
      container.setSize(44, 56);
      container.setDepth(10);
      container.gameId = slot.gameId;
      container.externalUrl = slot.game.externalUrl;
      container.playable = playable;
      container.baseY = y;

      if (playable) {
        container.setInteractive(
          new Phaser.Geom.Rectangle(-22, -28, 44, 56),
          Phaser.Geom.Rectangle.Contains,
        );
        container.on("pointerover", () => {
          container.setScale(1.08);
          this.statusText.setText(
            `▶ ${slot.game.title.toUpperCase()} · LIVE · INSERT SATS`,
          );
        });
        container.on("pointerout", () => {
          container.setScale(1);
          this.statusText.setText("WALK THE FLOOR · CLICK A CABINET");
        });
        container.on("pointerup", () => {
          this.statusText.setText(`INSERTING · ${slot.game.title.toUpperCase()}`);
          this.onCabinetSelect(slot.gameId, slot.game.externalUrl);
        });
      } else {
        const tape = this.add
          .text(0, 4, "WIP", {
            fontFamily: "monospace",
            fontSize: "9px",
            color: "#000000",
            backgroundColor: "#ff5a00",
            padding: { x: 4, y: 2 },
          })
          .setOrigin(0.5);
        container.add(tape);
        container.setInteractive(
          new Phaser.Geom.Rectangle(-22, -28, 44, 56),
          Phaser.Geom.Rectangle.Contains,
        );
        container.on("pointerover", () => {
          this.statusText.setText(
            `… ${slot.game.title.toUpperCase()} · CHIP IS STILL WIRING THIS ONE`,
          );
        });
        container.on("pointerout", () => {
          this.statusText.setText("WALK THE FLOOR · CLICK A CABINET");
        });
      }

      this.cabSprites.push(container);
    }
  }

  private makeCharacter(
    x: number,
    y: number,
    color: number,
    mark: string,
  ): Phaser.GameObjects.Container {
    const body = this.add.rectangle(0, 0, 14, 20, color).setStrokeStyle(1, 0x000000);
    const head = this.add.circle(0, -12, 6, 0xf5e6c8).setStrokeStyle(1, 0x000000);
    const tag = this.add
      .text(0, -1, mark, {
        fontFamily: "monospace",
        fontSize: "8px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    return this.add.container(x, y, [body, head, tag]);
  }

  private pulseAttract() {
    for (const cab of this.cabSprites) {
      if (!cab.playable) continue;
      this.tweens.add({
        targets: cab,
        y: cab.baseY - 3,
        duration: 200,
        yoyo: true,
        ease: "Quad.easeOut",
      });
    }
  }
}

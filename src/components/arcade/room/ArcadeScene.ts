/**
 * CoinUp Arcade Room — Phaser 3 (ADR-002)
 * Dual-aisle scrollable floor · large cabinets · Chip CRT manager
 */

import Phaser from "phaser";
import type { PlacedCabinet } from "@/lib/arcade-floor";

export type ArcadeSceneData = {
  cabinets: PlacedCabinet[];
  onCabinetSelect: (gameId: string, externalUrl?: string) => void;
};

/** Viewport (camera) size */
export const VIEW_W = 640;
export const VIEW_H = 480;

/** World grows with aisle length — supports ~20 cabinets */
const CAB_W = 72;
const CAB_H = 96;
const CAB_GAP_Y = 112;
const AISLE_MARGIN_X = 48;
const CENTER_AISLE_W = 160;
const WALL_TOP = 56;
const FLOOR_PAD_BOTTOM = 80;

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
  private statusText!: Phaser.GameObjects.Text;
  private worldW = VIEW_W;
  private worldH = VIEW_H;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private dragStart: { x: number; y: number } | null = null;

  constructor() {
    super("ArcadeScene");
  }

  init(data: ArcadeSceneData) {
    this.cabinets = data.cabinets ?? [];
    this.onCabinetSelect = data.onCabinetSelect ?? (() => {});
  }

  create() {
    const maxIndex = this.cabinets.reduce(
      (m, c) => Math.max(m, c.index),
      0,
    );
    const aisleLen = Math.max(maxIndex + 1, 4);

    this.worldW =
      AISLE_MARGIN_X * 2 + CAB_W * 2 + CENTER_AISLE_W + 40;
    this.worldH =
      WALL_TOP + aisleLen * CAB_GAP_Y + FLOOR_PAD_BOTTOM + 40;

    this.cameras.main.setBounds(0, 0, this.worldW, this.worldH);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(this.worldW / 2, Math.min(VIEW_H / 2, this.worldH / 2));

    this.drawRoom();
    this.layoutCabinets();
    this.spawnChip();
    this.spawnAmbient();
    this.setupHud();
    this.setupInput();

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.pulseAttract(),
    });
  }

  update() {
    if (!this.cursors) return;
    const cam = this.cameras.main;
    const speed = 4;
    if (this.cursors.left?.isDown) cam.scrollX -= speed;
    if (this.cursors.right?.isDown) cam.scrollX += speed;
    if (this.cursors.up?.isDown) cam.scrollY -= speed;
    if (this.cursors.down?.isDown) cam.scrollY += speed;
  }

  private drawRoom() {
    const w = this.worldW;
    const h = this.worldH;

    // Void / walls backdrop
    this.add.rectangle(w / 2, h / 2, w, h, 0x06040c).setDepth(0);

    // Floor
    const floor = this.add.graphics().setDepth(1);
    floor.fillStyle(0x12101c, 1);
    floor.fillRect(0, WALL_TOP, w, h - WALL_TOP);

    // Checkered tiles
    const tile = 32;
    for (let y = WALL_TOP; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const dark = ((x / tile) + (y / tile)) % 2 === 0;
        floor.fillStyle(dark ? 0x0e0c18 : 0x16142a, 1);
        floor.fillRect(x, y, tile, tile);
      }
    }

    // Neon wash on floor (center aisle)
    const wash = this.add.graphics().setDepth(2);
    wash.fillStyle(0x00d0ff, 0.06);
    wash.fillRect(w / 2 - CENTER_AISLE_W / 2, WALL_TOP, CENTER_AISLE_W, h - WALL_TOP);
    wash.fillStyle(0xff4ec7, 0.05);
    wash.fillCircle(w / 2, WALL_TOP + 120, 90);

    // Top wall bar
    floor.fillStyle(0x0a0a14, 1);
    floor.fillRect(0, 0, w, WALL_TOP);
    floor.lineStyle(2, 0x2a2a33, 1);
    floor.lineBetween(0, WALL_TOP, w, WALL_TOP);

    // Neon signs
    this.add
      .text(24, 18, "INSERT SATS", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#00d0ff",
      })
      .setDepth(5);
    this.add
      .text(w / 2, 16, "★ COINUP ARCADE ★", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#fcc76e",
      })
      .setOrigin(0.5, 0)
      .setDepth(5);
    this.add
      .text(w - 24, 18, "HIGH SCORE", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#ff4ec7",
      })
      .setOrigin(1, 0)
      .setDepth(5);

    // Entrance mat label
    this.add
      .text(w / 2, h - 28, "WALK THE AISLE · PICK A CABINET", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#3a3a44",
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  private layoutCabinets() {
    const leftX = AISLE_MARGIN_X + CAB_W / 2;
    const rightX = this.worldW - AISLE_MARGIN_X - CAB_W / 2;

    for (const slot of this.cabinets) {
      const x = slot.side === 0 ? leftX : rightX;
      const y = WALL_TOP + 56 + slot.index * CAB_GAP_Y + CAB_H / 2;
      const playable = slot.game.status === "playable";
      const accent = playable
        ? Phaser.Display.Color.HexStringToColor(
            slot.game.accent || "#00d0ff",
          ).color
        : 0x3a3a44;

      const parts: Phaser.GameObjects.GameObject[] = [];

      // Cabinet body
      const body = this.add
        .rectangle(0, 8, CAB_W, CAB_H - 8, 0x14141a)
        .setStrokeStyle(2, accent);
      parts.push(body);

      // Marquee
      const marquee = this.add
        .rectangle(0, -CAB_H / 2 + 10, CAB_W - 8, 16, 0x0a0a10)
        .setStrokeStyle(1, accent);
      parts.push(marquee);

      const marqueeText = this.add
        .text(0, -CAB_H / 2 + 10, slot.game.title.slice(0, 12).toUpperCase(), {
          fontFamily: "monospace",
          fontSize: "8px",
          color: playable ? "#fcc76e" : "#5c5c6b",
        })
        .setOrigin(0.5);
      parts.push(marqueeText);

      // Screen
      const screen = this.add
        .rectangle(0, -8, CAB_W - 20, 36, 0x000012)
        .setStrokeStyle(1, 0x1a1a28);
      parts.push(screen);

      const glyph = this.add
        .text(0, -8, playable ? slot.game.glyph : "…", {
          fontSize: "18px",
        })
        .setOrigin(0.5);
      parts.push(glyph);

      // Controls strip
      const panel = this.add.rectangle(0, 28, CAB_W - 16, 14, 0x1c1c24);
      parts.push(panel);
      const stick = this.add.circle(-14, 28, 4, 0xef4444);
      parts.push(stick);
      const btn1 = this.add.circle(6, 28, 3, 0x00de76);
      const btn2 = this.add.circle(16, 28, 3, 0xff4ec7);
      parts.push(btn1, btn2);

      // Coin slot
      const slotRect = this.add
        .rectangle(0, 42, 20, 6, 0x000000)
        .setStrokeStyle(1, 0xfcc76e);
      parts.push(slotRect);

      // Cost / status
      const cost = this.add
        .text(
          0,
          CAB_H / 2 - 4,
          playable ? `${slot.game.costSats} SATS` : "COMING SOON",
          {
            fontFamily: "monospace",
            fontSize: "7px",
            color: playable ? "#00de76" : "#5c5c6b",
          },
        )
        .setOrigin(0.5);
      parts.push(cost);

      const container = this.add.container(x, y, parts) as CabSprite;
      container.setSize(CAB_W, CAB_H);
      container.setDepth(10);
      container.gameId = slot.gameId;
      container.externalUrl = slot.game.externalUrl;
      container.playable = playable;
      container.baseY = y;

      if (!playable) {
        const tape = this.add
          .text(0, 4, "WIP", {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#000",
            backgroundColor: "#ff5a00",
            padding: { x: 6, y: 2 },
          })
          .setOrigin(0.5);
        container.add(tape);
      }

      container.setInteractive(
        new Phaser.Geom.Rectangle(-CAB_W / 2, -CAB_H / 2, CAB_W, CAB_H),
        Phaser.Geom.Rectangle.Contains,
      );

      container.on("pointerover", () => {
        container.setScale(1.06);
        this.statusText.setText(
          playable
            ? `▶ ${slot.game.title.toUpperCase()} · LIVE · INSERT SATS`
            : `… ${slot.game.title.toUpperCase()} · CHIP IS WIRING THIS ONE`,
        );
      });
      container.on("pointerout", () => {
        container.setScale(1);
        this.statusText.setText("WALK THE AISLE · CLICK A CABINET · DRAG TO LOOK");
      });
      if (playable) {
        container.on("pointerup", () => {
          this.statusText.setText(`INSERTING · ${slot.game.title.toUpperCase()}`);
          this.onCabinetSelect(slot.gameId, slot.game.externalUrl);
        });
      }

      this.cabSprites.push(container);
    }
  }

  /** Chip — CRT head, CoinUp hat, blue jacket (procedural match to official design) */
  private spawnChip() {
    const x = this.worldW / 2;
    const y = WALL_TOP + 100;

    const parts: Phaser.GameObjects.GameObject[] = [];

    // Legs
    const legL = this.add.rectangle(-5, 18, 7, 12, 0x1e3a8a);
    const legR = this.add.rectangle(5, 18, 7, 12, 0x1e3a8a);
    parts.push(legL, legR);
    // Shoes
    parts.push(this.add.rectangle(-5, 24, 9, 4, 0xf8fafc));
    parts.push(this.add.rectangle(5, 24, 9, 4, 0xf8fafc));

    // Body / jacket
    const jacket = this.add
      .rectangle(0, 4, 22, 20, 0x1d4ed8)
      .setStrokeStyle(1, 0xfbbf24);
    parts.push(jacket);
    // Badge
    parts.push(this.add.rectangle(6, 2, 6, 5, 0xfbbf24));

    // CRT head
    const head = this.add
      .rectangle(0, -14, 20, 16, 0xe7e5e4)
      .setStrokeStyle(1, 0xa8a29e);
    parts.push(head);
    // Screen face
    const face = this.add.rectangle(0, -14, 14, 11, 0x000000);
    parts.push(face);
    // Green eyes / mouth
    parts.push(
      this.add
        .text(-3, -16, "×", {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#00de76",
        })
        .setOrigin(0.5),
    );
    parts.push(
      this.add.rectangle(3, -16, 4, 4, 0x00de76),
    );
    parts.push(
      this.add.rectangle(0, -11, 6, 2, 0x00de76),
    );

    // Cap
    const cap = this.add.rectangle(0, -24, 22, 6, 0x1d4ed8);
    parts.push(cap);
    const capFront = this.add.rectangle(0, -21, 14, 5, 0xf8fafc);
    parts.push(capFront);
    parts.push(
      this.add
        .text(0, -21, "C", {
          fontFamily: "monospace",
          fontSize: "7px",
          color: "#fbbf24",
        })
        .setOrigin(0.5),
    );

    this.chip = this.add.container(x, y, parts);
    this.chip.setDepth(20);

    // Patrol center aisle
    const topY = WALL_TOP + 80;
    const botY = Math.max(topY + 80, this.worldH - 100);
    this.tweens.add({
      targets: this.chip,
      y: botY,
      duration: 6000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private spawnAmbient() {
    // Simple visitor dots for density
    for (let i = 0; i < 2; i++) {
      const visitor = this.add.container(
        this.worldW / 2 + (i === 0 ? -20 : 24),
        WALL_TOP + 160 + i * 40,
        [
          this.add.rectangle(0, 4, 10, 14, 0x3f3f46),
          this.add.circle(0, -6, 5, 0xf5e6c8),
        ],
      );
      visitor.setDepth(15);
      this.tweens.add({
        targets: visitor,
        y: visitor.y + 50 + i * 20,
        duration: 5000 + i * 900,
        yoyo: true,
        repeat: -1,
        ease: "Linear",
        delay: i * 400,
      });
    }
  }

  private setupHud() {
    this.statusText = this.add
      .text(12, VIEW_H - 22, "WALK THE AISLE · CLICK A CABINET · DRAG TO LOOK", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#00de76",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.dragStart = { x: p.x + this.cameras.main.scrollX, y: p.y + this.cameras.main.scrollY };
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.isDown || !this.dragStart) return;
      // Only pan if not clicking a cabinet (simple threshold)
      const cam = this.cameras.main;
      cam.scrollX = this.dragStart.x - p.x;
      cam.scrollY = this.dragStart.y - p.y;
    });
    this.input.on("pointerup", () => {
      this.dragStart = null;
    });

    this.input.on(
      "wheel",
      (
        _p: Phaser.Input.Pointer,
        _g: unknown,
        _dx: number,
        dy: number,
      ) => {
        this.cameras.main.scrollY += dy * 0.4;
      },
    );
  }

  private pulseAttract() {
    for (const cab of this.cabSprites) {
      if (!cab.playable) continue;
      this.tweens.add({
        targets: cab,
        y: cab.baseY - 4,
        duration: 180,
        yoyo: true,
        ease: "Quad.easeOut",
      });
    }
  }
}

"use client";

import Image from "next/image";
import { CARD_ROOM } from "@/lib/card-room/brand";
import { withBase } from "@/lib/paths";

/**
 * Playing card face or brand-book card back (panel 10 / 13).
 * Code format: "As", "Td", "Kh" or "AH", "10s", etc.
 */

const SUIT_GLYPH: Record<string, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣",
};

function parseCard(code: string): { rank: string; suit: string; red: boolean } {
  const c = code.trim();
  if (c.length < 2) return { rank: c, suit: "?", red: false };
  // "10s" / "10H"
  if (c.startsWith("10")) {
    const suit = c.slice(2, 3) || "?";
    const red = suit === "h" || suit === "H" || suit === "d" || suit === "D";
    return { rank: "10", suit: SUIT_GLYPH[suit] ?? suit, red };
  }
  const rank = c[0]!.toUpperCase();
  const suitCh = c[1]!;
  const red = suitCh === "h" || suitCh === "H" || suitCh === "d" || suitCh === "D";
  const rankShow = rank === "T" ? "10" : rank;
  return { rank: rankShow, suit: SUIT_GLYPH[suitCh] ?? suitCh, red };
}

export function PlayingCard({
  code,
  faceDown = false,
  size = "md",
}: {
  code?: string | null;
  faceDown?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "sm"
      ? { w: 36, h: 52, cls: "cr-card cr-card--sm" }
      : size === "lg"
        ? { w: 56, h: 84, cls: "cr-card cr-card--lg" }
        : { w: 44, h: 66, cls: "cr-card" };

  if (faceDown || !code) {
    return (
      <span className={dims.cls} aria-label="Card face down">
        <Image
          src={withBase(CARD_ROOM.assets.cardBack48)}
          alt=""
          width={dims.w}
          height={dims.h}
          unoptimized
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  const { rank, suit, red } = parseCard(code);
  return (
    <span
      className={[dims.cls, "cr-card--face", red ? "is-red" : "is-black"].join(
        " ",
      )}
      aria-label={`${rank} of ${suit}`}
    >
      <span className="cr-card-rank">{rank}</span>
      <span className="cr-card-suit">{suit}</span>
    </span>
  );
}

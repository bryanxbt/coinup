"use client";

import Image from "next/image";
import { CARD_ROOM } from "@/lib/card-room/brand";
import { withBase } from "@/lib/paths";

type ChipDenom = keyof typeof CARD_ROOM.assets.chips;

/** Pick closest brand chip art for a sat amount. */
export function denomForSats(sats: number): ChipDenom {
  if (sats >= 400_000) return "600k";
  if (sats >= 60_000) return "100k";
  if (sats >= 15_000) return "25k";
  if (sats >= 3_000) return "5k";
  return "1k";
}

export function ChipIcon({
  denom = "1k",
  size = 32,
  className = "",
  title,
}: {
  denom?: ChipDenom;
  size?: number;
  className?: string;
  title?: string;
}) {
  const src = CARD_ROOM.assets.chips[denom];
  return (
    <Image
      src={withBase(src)}
      alt={title ?? `${denom} chip`}
      width={size}
      height={size}
      unoptimized
      className={["pixelated cr-pixel shrink-0", className].join(" ")}
      title={title}
    />
  );
}

/** Decorative row of brand chips (panel 11). */
export function ChipRow({ className = "" }: { className?: string }) {
  const denoms = Object.keys(CARD_ROOM.assets.chips) as ChipDenom[];
  return (
    <div className={["flex flex-wrap items-center gap-2", className].join(" ")}>
      {denoms.map((d) => (
        <span key={d} className="inline-flex flex-col items-center gap-0.5">
          <ChipIcon denom={d} size={36} />
          <span className="cr-ui text-[8px] text-[var(--cr-brass)]/70">
            {d.toUpperCase()}
          </span>
        </span>
      ))}
    </div>
  );
}

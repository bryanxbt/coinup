"use client";

import Image from "next/image";
import { CARD_ROOM } from "@/lib/card-room/brand";
import { withBase } from "@/lib/paths";

/**
 * Brand book panel 03 — Jack the Dealer portrait in brass frame.
 */
export function JackPortrait({
  size = 200,
  showQuote = false,
  className = "",
}: {
  size?: number;
  showQuote?: boolean;
  className?: string;
}) {
  const src =
    size <= 64
      ? CARD_ROOM.jack.image64
      : size <= 128
        ? CARD_ROOM.jack.image128
        : CARD_ROOM.jack.image256;

  return (
    <figure className={["text-center", className].join(" ")}>
      <div className="cr-jack-frame mx-auto inline-block">
        <Image
          src={withBase(src)}
          alt={CARD_ROOM.jack.name}
          width={size}
          height={size}
          unoptimized
          priority={size >= 160}
          className="pixelated cr-pixel h-auto w-full"
        />
      </div>
      <figcaption className="cr-ui mt-2 text-[var(--cr-ivory)]/50">
        {CARD_ROOM.jack.name}
      </figcaption>
      {showQuote && (
        <p className="cr-quote mx-auto mt-2 max-w-[14rem] text-xs leading-relaxed text-[var(--cr-brass)]/90">
          “{CARD_ROOM.jack.quote}”
        </p>
      )}
    </figure>
  );
}

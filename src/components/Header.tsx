"use client";

import Image from "next/image";
import Link from "next/link";
import { formatSats, type ArcadeBalance } from "@/lib/payments";
import { withBase } from "@/lib/paths";

export function Header({
  balance,
  onAddCoin,
}: {
  balance: ArcadeBalance | null;
  onAddCoin: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[var(--steel)] bg-black px-3 py-3 sm:px-6">
      <Link href="/" className="group flex items-center gap-3">
        <Image
          src={withBase("/images/chip-arcade-manager-32.png")}
          alt="Chip the Arcade Manager"
          width={32}
          height={32}
          unoptimized
          className="pixelated"
        />
        <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
          <span className="font-pixel text-sm text-white sm:text-base">
            COIN<span className="text-[var(--neon-amber)]">UP</span>
          </span>
          <span className="hidden font-pixel text-[8px] text-[#5c5c6b] sm:inline">
            ARCADE
          </span>
        </span>
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <Link href="/brand" className="pixel-btn pixel-btn--ghost hidden sm:inline-flex">
          BRAND
        </Link>
        <div className="pixel-panel border-[var(--neon-amber)] px-3 py-2 font-pixel text-[9px] text-[var(--neon-amber)]">
          {balance ? formatSats(balance.availableSats).toUpperCase() : "---"}
        </div>
        <button type="button" onClick={onAddCoin} className="pixel-btn">
          INSERT COIN
        </button>
      </div>
    </header>
  );
}

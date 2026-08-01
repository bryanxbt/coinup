"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArcadeFloor } from "@/components/arcade/ArcadeFloor";
import { TypeLines } from "@/components/arcade/TypeText";
import { ChipPortrait } from "@/components/Chip";
import { BRAND } from "@/lib/brand";

export default function LobbyPage() {
  const heroLines = useMemo(
    () => [
      "COINUP ARCADE.",
      "BUILT FOR BITCOIN.",
      "POWERED BY ARCH NETWORK.",
      "INSERT SATS TO PLAY. WIN SATS.",
      "PLAY AT YOUR OWN RISK.",
    ],
    [],
  );

  return (
    <main className="arcade-grid relative flex-1 px-3 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-5xl">
        {/* Attract marquee */}
        <p className="marquee-flash mb-5 text-center font-pixel text-[10px] sm:text-xs">
          ★ COINUP ARCADE — WALK THE FLOOR · PICK A CABINET ★
        </p>

        {/* Hero strip: copy + Chip */}
        <section className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <TypeLines
              lines={heroLines}
              speed={16}
              lineGap={120}
              lineClassName="font-pixel text-[10px] sm:text-[11px] leading-relaxed text-[var(--crt-green)] mb-2"
            />
          </div>
          <div className="shrink-0 border-4 border-[var(--varsity-blue)] bg-black p-1 shadow-[6px_6px_0_#000]">
            <ChipPortrait size={128} priority showBadge className="!mt-0" />
          </div>
        </section>

        {/* THE FLOOR — main product surface */}
        <div className="mb-10">
          <ArcadeFloor />
        </div>

        {/* Secondary links */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/brand" className="pixel-btn pixel-btn--ghost">
            BRAND BOOK
          </Link>
          <p className="font-pixel text-[8px] text-[#3a3a44]">
            {BRAND.mission.bar}
          </p>
        </div>
      </div>
    </main>
  );
}
